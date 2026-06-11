"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { Category } from "@/lib/models/category";
import { Expense } from "@/lib/models/expense";
import { serialize } from "@/lib/serialize";
import { type ActionResult, actionError } from "./types";

export interface CategoryItem {
  _id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
}

export async function getCategories(): Promise<CategoryItem[]> {
  const user = await requireUser();
  const categories = await Category.find({ userId: user._id, deletedAt: null })
    .sort({ isDefault: -1, name: 1 })
    .lean();
  return serialize<CategoryItem[]>(categories);
}

const categorySchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  icon: z.string().min(1).max(50).default("circle"),
});

export async function createCategory(input: z.infer<typeof categorySchema>): Promise<ActionResult<CategoryItem>> {
  try {
    const user = await requireUser();
    const data = categorySchema.parse(input);
    const existing = await Category.findOne({ userId: user._id, name: data.name, deletedAt: null });
    if (existing) return { success: false, error: "A category with this name already exists" };
    const category = await Category.create({ ...data, userId: user._id, isDefault: false });
    revalidatePath("/expenses");
    return { success: true, data: serialize<CategoryItem>(category) };
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const category = await Category.findOne({ _id: id, userId: user._id, deletedAt: null });
    if (!category) return { success: false, error: "Category not found" };
    if (category.isDefault) return { success: false, error: "Default categories cannot be deleted" };
    const inUse = await Expense.countDocuments({ categoryId: id, deletedAt: null });
    if (inUse > 0) {
      return { success: false, error: `Category is used by ${inUse} expense(s)` };
    }
    await Category.updateOne({ _id: id }, { $set: { deletedAt: new Date() } });
    revalidatePath("/expenses");
    return { success: true };
  } catch (err) {
    return actionError(err);
  }
}
