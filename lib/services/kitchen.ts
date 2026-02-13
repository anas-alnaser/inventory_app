/**
 * Kitchen Display Screen (KDS) Service
 * Real-time order tracking for kitchen staff
 */

import {
    doc,
    updateDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    Unsubscribe,
} from 'firebase/firestore';
import { invoicesCollection } from '@/lib/firestore';
import type { Invoice, KitchenStatus } from '@/types/entities';

export interface KitchenOrder extends Invoice {
    id: string;
}

/**
 * Listen to kitchen orders in real-time
 * Returns orders where kitchenStatus is NOT 'served'
 * Orders are sorted by created_at ascending (oldest first)
 */
export function listenToKitchenOrders(
    branchId: string,
    callback: (orders: KitchenOrder[]) => void,
    onError?: (error: Error) => void
): Unsubscribe {
    // Query invoices that are not served yet
    // We filter for pending, preparing, and ready statuses
    const q = query(
        invoicesCollection,
        where('branch_id', '==', branchId),
        where('kitchenStatus', 'in', ['pending', 'preparing', 'ready']),
        orderBy('created_at', 'asc')
    );

    return onSnapshot(
        q,
        (snapshot) => {
            const orders: KitchenOrder[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as any),
            })) as KitchenOrder[];

            callback(orders);
        },
        (error) => {
            console.error('Error listening to kitchen orders:', error);
            onError?.(error);
        }
    );
}

/**
 * Update kitchen status for an order
 * Moves order between KDS columns
 */
export async function updateKitchenStatus(
    orderId: string,
    newStatus: KitchenStatus
): Promise<{ success: boolean; error?: string }> {
    try {
        const orderRef = doc(invoicesCollection, orderId);

        await updateDoc(orderRef, {
            kitchenStatus: newStatus,
        });

        return { success: true };
    } catch (error: any) {
        console.error('Error updating kitchen status:', error);
        return {
            success: false,
            error: error.message || 'Failed to update order status',
        };
    }
}

/**
 * Get the next kitchen status in the workflow
 */
export function getNextKitchenStatus(currentStatus: KitchenStatus): KitchenStatus | null {
    const workflow: Record<KitchenStatus, KitchenStatus | null> = {
        pending: 'preparing',
        preparing: 'ready',
        ready: 'served',
        served: null, // End of workflow
    };

    return workflow[currentStatus];
}

/**
 * Get button label for transitioning to next status
 */
export function getStatusActionLabel(currentStatus: KitchenStatus): string {
    const labels: Record<KitchenStatus, string> = {
        pending: 'Start Cooking',
        preparing: 'Mark Ready',
        ready: 'Complete Order',
        served: 'Done',
    };

    return labels[currentStatus];
}

/**
 * Format relative time (e.g., "5 mins ago")
 */
export function formatRelativeTime(date: Date | string): string {
    const now = new Date();
    const orderDate = date instanceof Date ? date : new Date(date);
    const diffMs = now.getTime() - orderDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;

    return orderDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });
}
