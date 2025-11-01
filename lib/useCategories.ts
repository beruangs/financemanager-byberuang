import { useState, useEffect, useCallback } from 'react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, BILL_CATEGORIES } from '@/lib/constants';

interface CustomCategory {
  _id: string;
  name: string;
  type: 'expense' | 'income' | 'bill';
  icon?: string;
  color?: string;
}

export function useCategories(type: 'expense' | 'income' | 'bill') {
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get base categories
  const getBaseCategories = useCallback(() => {
    switch (type) {
      case 'expense':
        return EXPENSE_CATEGORIES;
      case 'income':
        return INCOME_CATEGORIES;
      case 'bill':
        return BILL_CATEGORIES;
      default:
        return [];
    }
  }, [type]);

  // Fetch custom categories
  const fetchCustomCategories = useCallback(async () => {
    try {
      const response = await fetch(`/api/custom-categories?type=${type}`);
      if (response.ok) {
        const data = await response.json();
        setCustomCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching custom categories:', error);
    }
  }, [type]);

  useEffect(() => {
    fetchCustomCategories();
  }, [fetchCustomCategories]);

  // Add custom category
  const addCustomCategory = async (name: string, icon?: string, color?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/custom-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, icon, color }),
      });

      if (response.ok) {
        await fetchCustomCategories();
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error };
      }
    } catch (error) {
      console.error('Error adding custom category:', error);
      return { success: false, error: 'Terjadi kesalahan' };
    } finally {
      setIsLoading(false);
    }
  };

  // Delete custom category
  const deleteCustomCategory = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/custom-categories/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCustomCategories();
        return { success: true };
      } else {
        return { success: false, error: 'Gagal menghapus kategori' };
      }
    } catch (error) {
      console.error('Error deleting custom category:', error);
      return { success: false, error: 'Terjadi kesalahan' };
    } finally {
      setIsLoading(false);
    }
  };

  // Combine base + custom categories
  const allCategories = [
    ...getBaseCategories(),
    ...customCategories.map(c => c.name),
  ];

  return {
    baseCategories: getBaseCategories(),
    customCategories,
    allCategories,
    addCustomCategory,
    deleteCustomCategory,
    refreshCategories: fetchCustomCategories,
    isLoading,
  };
}
