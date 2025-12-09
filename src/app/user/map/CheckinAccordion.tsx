"use client";

import React, { useEffect, useState } from "react";
import DestinationCard from "@/components/cards/DestinationCard";
import { FiMinus, FiPlus, FiCheckCircle  } from "react-icons/fi";
import { checkinApi } from "@/lib/checkin/checkinApi";

type Ward = {
  _id: string;
  name: string;
  type: string;
};

type Place = {
  _id: string;
  name: string;
  address: string;
  ward: string | Ward;
  district: string;
  avgRating: number;
  totalRatings: number;
  images?: string[];
};

type Checkin = {
  _id: string;
  placeId: Place;
  note?: string;
  checkinTime: string;
};

type PlaceGroup = {
  group: string;
  destinations: {
    title: string;
    location: string;
    distance: string;
    image: string;
  }[];
};

const CheckinAccordion = () => {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [groups, setGroups] = useState<any[]>([]); // Dùng any tạm nếu lười define lại type PlaceGroup

  useEffect(() => {
    const fetchData = async () => {
      try {
        const checkins = await checkinApi.getUserCheckins();
        const groupMap: Record<string, any> = {};

        checkins.forEach((c: any) => {
          // Logic group như cũ
          const wardName =
            typeof c.placeId.ward === "object"
              ? c.placeId.ward.name
              : c.placeId.ward || "Khác";
          if (!groupMap[wardName])
            groupMap[wardName] = { group: wardName, destinations: [] };

          groupMap[wardName].destinations.push({
            title: c.placeId.name,
            location: c.placeId.address || "",
            distance: "—",
            image: c.placeId.images?.[0] || "/hot-destination.svg",
          });
        });

        const groupArr = Object.values(groupMap);
        setGroups(groupArr);
        if (groupArr.length > 0) setOpenGroup(groupArr[0].group);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const toggleGroup = (group: string) => {
    setOpenGroup(openGroup === group ? null : group);
  };

  if (groups.length === 0) return null;

  return (
    <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
          <FiCheckCircle size={24} />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">
            Nhật ký hành trình
          </h2>
          <p className="text-sm text-slate-500">
            Chi tiết các địa điểm bạn đã chinh phục
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {groups.map((item) => {
          const isOpen = openGroup === item.group;
          return (
            <div
              key={item.group}
              className={`overflow-hidden rounded-xl border ${
                isOpen
                  ? "border-emerald-200 bg-emerald-50/30"
                  : "border-slate-200 bg-white"
              } transition-all`}
            >
              <button
                onClick={() => toggleGroup(item.group)}
                className="w-full flex items-center justify-between px-6 py-4 font-bold text-left text-slate-700 hover:text-emerald-700 transition-colors"
              >
                <span className="text-lg">
                  {item.group}{" "}
                  <span className="text-sm font-normal text-slate-400 ml-2">
                    ({item.destinations.length} địa điểm)
                  </span>
                </span>
                <span
                  className={`p-1 rounded-full ${
                    isOpen
                      ? "bg-emerald-200 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {isOpen ? <FiMinus /> : <FiPlus />}
                </span>
              </button>

              {isOpen && (
                <div className="p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-2 fade-in duration-300">
                  {item.destinations.map((d: any, idx: number) => (
                    <DestinationCard key={idx} {...d} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CheckinAccordion;
