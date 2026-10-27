import React from 'react';
import { CheckCircle2, Clock, MapPin, Receipt, ArrowRight, X } from 'lucide-react';
import { Order } from '../types';

interface OrderConfirmationModalProps {
  order: Order | null;
  onClose: () => void;
  onViewDashboard: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  onClose,
  onViewDashboard,
}) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200 relative text-center p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-xl transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Animated Celebration Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
          Order Placed Successfully
        </span>

        <h2 className="text-2xl sm:text-3xl font-bold font-display text-stone-900 mt-2">
          Thank you, {order.customerName.split(' ')[0]}!
        </h2>
        <p className="text-stone-600 text-xs sm:text-sm mt-1 max-w-sm mx-auto">
          Our kitchen has received your order and is preparing your meal with exceptional care.
        </p>

        {/* Order Details Card */}
        <div className="mt-6 p-5 rounded-2xl bg-stone-50 border border-stone-200 text-left space-y-3.5 text-xs">
          <div className="flex justify-between items-center pb-2.5 border-b border-stone-200">
            <span className="text-stone-500 font-medium">Order Number</span>
            <span className="font-mono font-bold text-amber-700 text-sm">{order.orderNumber}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-stone-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              Estimated Delivery
            </span>
            <span className="font-semibold text-stone-900">30 – 45 Minutes</span>
          </div>

          <div className="flex justify-between items-start gap-3">
            <span className="text-stone-500 shrink-0 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-stone-400" />
              Destination
            </span>
            <span className="font-medium text-stone-900 text-right truncate max-w-[220px]">
              {order.deliveryAddress}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2.5 border-t border-stone-200">
            <span className="text-stone-500 font-medium">Total Charged</span>
            <span className="font-display font-bold text-base text-stone-900">
              ${order.total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => {
              onClose();
              onViewDashboard();
            }}
            className="w-full sm:flex-1 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>Track Order Status</span>
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3.5 rounded-2xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs sm:text-sm transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
