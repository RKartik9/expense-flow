"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { requireUser } from "@/lib/auth";
import { Split } from "@/lib/models/split";
import { SplitParticipant } from "@/lib/models/split-participant";
import { Settlement, SETTLEMENT_METHODS } from "@/lib/models/settlement";
import { GroupMember } from "@/lib/models/group-member";
import { User } from "@/lib/models/user";
import { computeShares } from "@/lib/settlement/split-math";
import { createNotification, logActivity } from "@/lib/notify";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail, APP_URL } from "@/lib/email";
import { SplitCreatedEmail } from "@/emails/split-created";
import { PaymentReminderEmail } from "@/emails/payment-reminder";
import { SettlementCompletedEmail } from "@/emails/settlement-completed";
import { formatCurrency } from "@/lib/format";
import { serialize } from "@/lib/serialize";
import { type ActionResult, actionError } from "./types";

export interface SplitListItem {
  _id: string;
  title: string;
  totalAmount: number;
  currency: string;
  splitType: string;
  status: string;
  date: string;
  isPayer: boolean;
  myShare: number | null;
  myOutstanding: number | null;
  outstandingTotal: number;
  participantCount: number;
  groupName?: string;
}

export interface SplitParticipantDetail {
  _id: string;
  userId: string | null;
  name: string;
  email: string;
  imageUrl?: string;
  shareAmount: number;
  percentage: number | null;
  paidAmount: number;
  isPayer: boolean;
  status: "pending" | "partial" | "paid";
}

export interface SettlementItem {
  _id: string;
  fromName: string;
  toName: string;
  amount: number;
  method: string;
  status: string;
  proofUrl?: string;
  note?: string;
  settledAt: string | null;
  createdAt: string;
}

export interface SplitDetail {
  _id: string;
  title: string;
  description?: string;
  totalAmount: number;
  currency: string;
  splitType: string;
  status: string;
  date: string;
  receiptUrl?: string;
  payerName: string;
  payerId: string;
  isPayer: boolean;
  isCreator: boolean;
  myParticipantId: string | null;
  groupId: string | null;
  groupName?: string;
  participants: SplitParticipantDetail[];
  settlements: SettlementItem[];
}

const participantSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  value: z.number().optional(),
});

const createSplitSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  totalAmount: z.number().positive(),
  currency: z.string().min(3).max(3),
  splitType: z.enum(["equal", "percentage", "exact"]),
  date: z.string(),
  groupId: z.string().optional().nullable(),
  receiptUrl: z.string().url().optional().or(z.literal("")),
  participants: z.array(participantSchema).min(1).max(50),
});

export type CreateSplitInput = z.infer<typeof createSplitSchema>;

export async function createSplit(input: CreateSplitInput): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    rateLimit(`split:${user._id}`, 20);
    const data = createSplitSchema.parse(input);

    if (data.groupId) {
      const membership = await GroupMember.findOne({
        groupId: data.groupId,
        userId: user._id,
        status: "active",
        deletedAt: null,
      });
      if (!membership) return { success: false, error: "You are not a member of this group" };
    }

    // Normalize emails and ensure the payer (creator) is among participants
    const emails = data.participants.map((p) => p.email.toLowerCase());
    const myEmail = user.email.toLowerCase();
    const allParticipants = emails.includes(myEmail)
      ? data.participants.map((p) => ({ ...p, email: p.email.toLowerCase() }))
      : [
          { email: myEmail, name: user.name, value: undefined },
          ...data.participants.map((p) => ({ ...p, email: p.email.toLowerCase() })),
        ];

    const unique = new Set(allParticipants.map((p) => p.email));
    if (unique.size !== allParticipants.length) {
      return { success: false, error: "Duplicate participants" };
    }

    const shares = computeShares(
      data.splitType,
      data.totalAmount,
      allParticipants.map((p) => ({ key: p.email, value: p.value }))
    );

    const existingUsers = await User.find({
      email: { $in: allParticipants.map((p) => p.email) },
      deletedAt: null,
    })
      .select("email name")
      .lean();
    const userByEmail = new Map(existingUsers.map((u) => [u.email, u]));

    const split = await Split.create({
      title: data.title,
      description: data.description,
      totalAmount: data.totalAmount,
      currency: data.currency,
      splitType: data.splitType,
      createdById: user._id,
      payerId: user._id,
      groupId: data.groupId || null,
      date: new Date(data.date),
      receiptUrl: data.receiptUrl || undefined,
      status: "open",
    });

    await SplitParticipant.insertMany(
      allParticipants.map((p) => {
        const share = shares.find((s) => s.key === p.email)!;
        const linked = userByEmail.get(p.email);
        const isPayer = p.email === myEmail;
        return {
          splitId: split._id,
          userId: linked?._id ?? null,
          email: p.email,
          name: linked?.name ?? p.name ?? p.email.split("@")[0],
          shareAmount: share.shareAmount,
          percentage: share.percentage,
          paidAmount: isPayer ? share.shareAmount : 0,
          isPayer,
          status: isPayer ? "paid" : "pending",
        };
      })
    );

    const splitUrl = `${APP_URL}/splits/${split._id}`;
    await Promise.all(
      allParticipants
        .filter((p) => p.email !== myEmail)
        .map(async (p) => {
          const linked = userByEmail.get(p.email);
          const share = shares.find((s) => s.key === p.email)!;
          if (linked) {
            await createNotification({
              userId: String(linked._id),
              type: "new_split",
              title: `${user.name} added you to "${data.title}"`,
              body: `Your share is ${formatCurrency(share.shareAmount, data.currency)}`,
              link: `/splits/${split._id}`,
            });
          }
          await sendEmail({
            to: p.email,
            subject: `${user.name} added you to a split: ${data.title}`,
            type: "split_created",
            userId: linked ? String(linked._id) : null,
            react: SplitCreatedEmail({
              creatorName: user.name,
              splitTitle: data.title,
              totalAmount: String(data.totalAmount),
              yourShare: String(share.shareAmount),
              currency: data.currency,
              splitUrl,
            }),
          });
        })
    );

    if (data.groupId) {
      await logActivity({
        userId: String(user._id),
        groupId: data.groupId,
        action: "split_created",
        details: `added split "${data.title}" (${formatCurrency(data.totalAmount, data.currency)})`,
        entityType: "split",
        entityId: String(split._id),
      });
    }

    revalidatePath("/splits");
    if (data.groupId) revalidatePath(`/groups/${data.groupId}`);
    return { success: true, data: { id: String(split._id) } };
  } catch (err) {
    return actionError(err);
  }
}

export async function getSplits(): Promise<SplitListItem[]> {
  const user = await requireUser();

  const myParticipations = await SplitParticipant.find({ userId: user._id, deletedAt: null })
    .select("splitId shareAmount paidAmount isPayer")
    .lean();
  const splitIds = myParticipations.map((p) => p.splitId);

  const splits = await Split.find({
    deletedAt: null,
    $or: [{ createdById: user._id }, { _id: { $in: splitIds } }],
  })
    .populate("groupId", "name")
    .sort({ date: -1 })
    .limit(100)
    .lean();

  const allParticipants = await SplitParticipant.find({
    splitId: { $in: splits.map((s) => s._id) },
    deletedAt: null,
  }).lean();

  return serialize<SplitListItem[]>(
    splits.map((s) => {
      const parts = allParticipants.filter((p) => String(p.splitId) === String(s._id));
      const mine = parts.find((p) => p.userId && String(p.userId) === String(user._id));
      const outstandingTotal = parts.reduce(
        (sum, p) => (p.isPayer ? sum : sum + Math.max(0, p.shareAmount - p.paidAmount)),
        0
      );
      return {
        _id: s._id,
        title: s.title,
        totalAmount: s.totalAmount,
        currency: s.currency,
        splitType: s.splitType,
        status: s.status,
        date: s.date,
        isPayer: String(s.payerId) === String(user._id),
        myShare: mine?.shareAmount ?? null,
        myOutstanding: mine && !mine.isPayer ? Math.max(0, mine.shareAmount - mine.paidAmount) : null,
        outstandingTotal,
        participantCount: parts.length,
        groupName: (s.groupId as { name?: string } | null)?.name,
      };
    })
  );
}

export async function getSplitDetail(id: string): Promise<SplitDetail | null> {
  const user = await requireUser();
  if (!Types.ObjectId.isValid(id)) return null;

  const split = await Split.findOne({ _id: id, deletedAt: null })
    .populate("payerId", "name")
    .populate("groupId", "name")
    .lean();
  if (!split) return null;

  const participants = await SplitParticipant.find({ splitId: id, deletedAt: null })
    .populate("userId", "name email imageUrl")
    .lean();

  const mine = participants.find(
    (p) => p.userId && String((p.userId as { _id: unknown })._id) === String(user._id)
  );
  const isCreator = String(split.createdById) === String(user._id);
  if (!mine && !isCreator) return null;

  const settlements = await Settlement.find({ splitId: id, deletedAt: null })
    .populate("fromUserId", "name")
    .populate("toUserId", "name")
    .sort({ createdAt: -1 })
    .lean();

  const payer = split.payerId as { _id: unknown; name?: string } | null;

  return serialize<SplitDetail>({
    _id: split._id,
    title: split.title,
    description: split.description,
    totalAmount: split.totalAmount,
    currency: split.currency,
    splitType: split.splitType,
    status: split.status,
    date: split.date,
    receiptUrl: split.receiptUrl,
    payerName: payer?.name ?? "Unknown",
    payerId: payer?._id ?? split.payerId,
    isPayer: String(payer?._id ?? split.payerId) === String(user._id),
    isCreator,
    myParticipantId: mine?._id ?? null,
    groupId: split.groupId ? (split.groupId as { _id: unknown })._id : null,
    groupName: (split.groupId as { name?: string } | null)?.name,
    participants: participants.map((p) => {
      const u = p.userId as { _id?: unknown; name?: string; email?: string; imageUrl?: string } | null;
      return {
        _id: p._id,
        userId: u?._id ?? null,
        name: u?.name ?? p.name ?? p.email,
        email: u?.email ?? p.email,
        imageUrl: u?.imageUrl,
        shareAmount: p.shareAmount,
        percentage: p.percentage,
        paidAmount: p.paidAmount,
        isPayer: p.isPayer,
        status: p.status,
      };
    }),
    settlements: settlements.map((st) => ({
      _id: st._id,
      fromName: (st.fromUserId as { name?: string } | null)?.name ?? "Unknown",
      toName: (st.toUserId as { name?: string } | null)?.name ?? "Unknown",
      amount: st.amount,
      method: st.method,
      status: st.status,
      proofUrl: st.proofUrl,
      note: st.note,
      settledAt: st.settledAt,
      createdAt: st.createdAt,
    })),
  });
}

const recordPaymentSchema = z.object({
  splitId: z.string(),
  participantId: z.string(),
  amount: z.number().positive(),
  method: z.enum(SETTLEMENT_METHODS),
  proofUrl: z.string().url().optional().or(z.literal("")),
  note: z.string().max(500).optional(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

export async function recordPayment(input: RecordPaymentInput): Promise<ActionResult> {
  try {
    const user = await requireUser();
    rateLimit(`payment:${user._id}`, 30);
    const data = recordPaymentSchema.parse(input);

    const split = await Split.findOne({ _id: data.splitId, deletedAt: null });
    if (!split) return { success: false, error: "Split not found" };

    const participant = await SplitParticipant.findOne({
      _id: data.participantId,
      splitId: split._id,
      deletedAt: null,
    });
    if (!participant) return { success: false, error: "Participant not found" };
    if (participant.isPayer) return { success: false, error: "The payer has nothing to settle" };

    const isPayer = String(split.payerId) === String(user._id);
    const isSelf = participant.userId && String(participant.userId) === String(user._id);
    if (!isPayer && !isSelf) {
      return { success: false, error: "Only the payer or the participant can record a payment" };
    }

    const outstanding = participant.shareAmount - participant.paidAmount;
    if (data.amount > outstanding + 0.01) {
      return { success: false, error: "Amount exceeds the outstanding balance" };
    }

    if (!participant.userId) {
      return { success: false, error: "This participant hasn't joined ExpenseFlow yet" };
    }

    const newPaid = Math.min(participant.shareAmount, participant.paidAmount + data.amount);
    const fullyPaid = newPaid >= participant.shareAmount - 0.01;

    await Settlement.create({
      splitId: split._id,
      groupId: split.groupId,
      fromUserId: participant.userId,
      toUserId: split.payerId,
      amount: data.amount,
      currency: split.currency,
      method: data.method,
      status: "paid",
      proofUrl: data.proofUrl || undefined,
      note: data.note,
      settledAt: new Date(),
    });

    participant.paidAmount = newPaid;
    participant.status = fullyPaid ? "paid" : "partial";
    await participant.save();

    const remaining = await SplitParticipant.countDocuments({
      splitId: split._id,
      isPayer: false,
      status: { $ne: "paid" },
      deletedAt: null,
    });
    if (remaining === 0) {
      split.status = "settled";
      await split.save();
    }

    const amountStr = formatCurrency(data.amount, split.currency);
    const splitUrl = `${APP_URL}/splits/${split._id}`;

    // Notify the other party
    const counterpartyId = isSelf ? String(split.payerId) : String(participant.userId);
    await createNotification({
      userId: counterpartyId,
      type: fullyPaid ? "settlement_completed" : "payment_received",
      title: fullyPaid
        ? `Settlement completed for "${split.title}"`
        : `Payment of ${amountStr} recorded for "${split.title}"`,
      link: `/splits/${split._id}`,
    });

    if (fullyPaid) {
      const [fromUser, toUser] = await Promise.all([
        User.findById(participant.userId).lean(),
        User.findById(split.payerId).lean(),
      ]);
      for (const [recipient, counterparty] of [
        [fromUser, toUser],
        [toUser, fromUser],
      ] as const) {
        if (recipient?.email && recipient.notificationPrefs?.emailReminders !== false) {
          await sendEmail({
            to: recipient.email,
            subject: "Settlement completed",
            type: "settlement_completed",
            userId: String(recipient._id),
            react: SettlementCompletedEmail({
              counterpartyName: counterparty?.name ?? "your friend",
              splitTitle: split.title,
              amount: amountStr,
              splitUrl,
            }),
          });
        }
      }
    }

    if (split.groupId) {
      await logActivity({
        userId: String(user._id),
        groupId: String(split.groupId),
        action: "payment_recorded",
        details: `recorded a payment of ${amountStr} for "${split.title}"`,
      });
      revalidatePath(`/groups/${split.groupId}`);
    }
    revalidatePath(`/splits/${split._id}`);
    revalidatePath("/splits");
    return { success: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function remindParticipant(splitId: string, participantId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    rateLimit(`remind:${user._id}`, 10);

    const split = await Split.findOne({ _id: splitId, deletedAt: null });
    if (!split) return { success: false, error: "Split not found" };
    if (String(split.payerId) !== String(user._id)) {
      return { success: false, error: "Only the payer can send reminders" };
    }

    const participant = await SplitParticipant.findOne({
      _id: participantId,
      splitId,
      deletedAt: null,
    });
    if (!participant || participant.isPayer || participant.status === "paid") {
      return { success: false, error: "Nothing to remind for this participant" };
    }

    const outstanding = participant.shareAmount - participant.paidAmount;
    await sendEmail({
      to: participant.email,
      subject: "You have a pending payment",
      type: "payment_reminder",
      userId: participant.userId ? String(participant.userId) : null,
      react: PaymentReminderEmail({
        payerName: user.name,
        splitTitle: split.title,
        outstanding: formatCurrency(outstanding, split.currency),
        splitUrl: `${APP_URL}/splits/${split._id}`,
      }),
    });

    if (participant.userId) {
      await createNotification({
        userId: String(participant.userId),
        type: "payment_reminder",
        title: `Reminder: you owe ${formatCurrency(outstanding, split.currency)} for "${split.title}"`,
        link: `/splits/${split._id}`,
      });
    }

    participant.lastRemindedAt = new Date();
    await participant.save();
    return { success: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteSplit(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const split = await Split.findOne({ _id: id, createdById: user._id, deletedAt: null });
    if (!split) return { success: false, error: "Split not found" };
    await Split.updateOne({ _id: id }, { $set: { deletedAt: new Date() } });
    await SplitParticipant.updateMany({ splitId: id }, { $set: { deletedAt: new Date() } });
    revalidatePath("/splits");
    if (split.groupId) revalidatePath(`/groups/${split.groupId}`);
    return { success: true };
  } catch (err) {
    return actionError(err);
  }
}
