"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Anchor, Mountain, TreePine, Building, CheckCircle, ArrowRight, X } from "lucide-react";
import { journeyApi, JourneyCollection } from "@/lib/checkin/journeyApi";
import Link from "next/link";
import useUser from "#/src/hooks/useUser";

const iconMap: Record<string, any> = {
  compass: Compass,
  anchor: Anchor,
  mountain: Mountain,
  tree: TreePine,
  city: Building,
};

export default function Collections() {
  const { isAuthenticated } = useUser();
  const [collections, setCollections] = useState<JourneyCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCol, setSelectedCol] = useState<JourneyCollection | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    journeyApi.getMyCollections()
      .then(res => setCollections(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex justify-center items-center h-40">
        <p className="text-slate-500 animate-pulse">Đang tải bộ sưu tập...</p>
      </div>
    );
  }

  return (
    <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
          <Compass size={24} />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">
            Bộ sưu tập vùng miền
          </h2>
          <p className="text-sm text-slate-500">
            Mở khoá các tỉnh để hoàn thành bộ sưu tập
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((col, idx) => {
          const Icon = iconMap[col.icon] || Compass;
          const isCompleted = col.completed;
          const progressPercent = (col.unlocked / col.total) * 100;

          return (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setSelectedCol(col)}
              className={`relative cursor-pointer rounded-2xl p-5 border-2 transition-all hover:shadow-lg ${
                isCompleted
                  ? "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 hover:-translate-y-1"
                  : "border-slate-100 bg-slate-50 hover:-translate-y-1"
              }`}
            >
              {isCompleted && (
                <div className="absolute top-4 right-4 text-amber-500">
                  <CheckCircle size={24} />
                </div>
              )}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                isCompleted ? "bg-amber-500 text-white shadow-md" : "bg-slate-200 text-slate-500"
              }`}>
                <Icon size={24} />
              </div>
              <h3 className={`font-bold text-lg mb-1 ${isCompleted ? "text-amber-700" : "text-slate-800"}`}>
                {col.name}
              </h3>
              <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[40px]">
                {col.description}
              </p>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Tiến độ</span>
                  <span>{col.unlocked}/{col.total}</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className={`h-full rounded-full ${isCompleted ? "bg-amber-500" : "bg-indigo-500"}`}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedCol && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setSelectedCol(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`p-6 text-white text-center ${selectedCol.completed ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-gradient-to-br from-indigo-500 to-blue-600"}`}>
                <button
                  onClick={() => setSelectedCol(null)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white"
                >
                  <X size={24} />
                </button>
                <h3 className="text-2xl font-black">{selectedCol.name}</h3>
                <p className="text-white/90 mt-2">{selectedCol.description}</p>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <h4 className="font-bold text-slate-800 mb-3">Tỉnh thành trong bộ sưu tập:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCol.provinces.map(p => {
                      const isUnlocked = !selectedCol.missingProvinces.includes(p);
                      return (
                        <span
                          key={p}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border ${
                            isUnlocked
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-50 text-slate-500 border-slate-200"
                          }`}
                        >
                          {isUnlocked && <CheckCircle size={14} className="text-emerald-500" />}
                          {p}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {!selectedCol.completed && (
                  <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                    <p className="text-sm text-slate-500 mb-3">
                      Còn thiếu {selectedCol.missingProvinces.length} tỉnh. Đặt tour ngay để hoàn thành!
                    </p>
                    <Link
                      href="/user/destination"
                      className="inline-flex items-center justify-center w-full gap-2 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors"
                    >
                      Tìm tour gợi ý
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
