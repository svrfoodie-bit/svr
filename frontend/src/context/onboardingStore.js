import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const STEPS = [
  {
    id: 'add_customer',
    title: 'Add your first customer',
    description: 'Customers are needed to create sales orders.',
    path: '/customers/new',
    cta: 'Add Customer',
  },
  {
    id: 'add_supplier',
    title: 'Add a supplier (RAW)',
    description: 'Raw suppliers are linked to raw cashew purchases.',
    path: '/supplier-summary',
    cta: 'View Suppliers (RAW)',
  },
  {
    id: 'add_purchase',
    title: 'Record a raw purchase',
    description: 'Log your first cashew purchase from a supplier.',
    path: '/raw-purchases/new',
    cta: 'New Purchase',
  },
  {
    id: 'add_worker',
    title: 'Add a worker',
    description: 'Workers are used for job work and daily wages.',
    path: '/workers/new',
    cta: 'Add Worker',
  },
  {
    id: 'add_sales_order',
    title: 'Create a sales order',
    description: 'Record your first cashew sale to a customer.',
    path: '/sales-orders/new',
    cta: 'New Sale',
  },
  {
    id: 'explore_dashboard',
    title: 'Explore the dashboard',
    description: 'Review your KPIs and business at a glance.',
    path: '/',
    cta: 'Go to Dashboard',
  },
];

export const useOnboardingStore = create(
  persist(
    (set) => ({
      visible: false,
      minimized: false,
      completed: {},
      dismissed: false,

      show:     () => set({ visible: true, minimized: false }),
      minimize: () => set({ minimized: true }),
      expand:   () => set({ minimized: false }),
      dismiss:  () => set({ dismissed: true, visible: false }),

      markComplete: (id) =>
        set((state) => ({ completed: { ...state.completed, [id]: true } })),

      syncCompleted: (ids) =>
        set((state) => ({
          completed: {
            ...state.completed,
            ...Object.fromEntries(ids.map((id) => [id, true])),
          },
        })),
    }),
    { name: 'svr-onboarding' }
  )
);
