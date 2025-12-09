import { useRouter } from 'next/navigation';
import { Destination } from "@/app/assets/data/destinations";
import Image from "next/image";

interface Props {
  destination: Destination;
}


const DestinationCard = ({ destination }: Props) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/user/destination/${(destination as any)._id || destination.id}`);
  };

  const imageUrl = destination.images?.[0] || "/image.svg";

  return (
    <div className="grid grid-cols-[30%_70%] rounded-xl shadow-md bg-white overflow-hidden">
      {/* Ảnh */}
      <Image
        alt={destination.name}
        src={imageUrl}
        width={400}
        height={300}
        unoptimized
        className="w-full h-48 object-cover"
      />

      {/* Nội dung */}
      <div className="flex flex-col p-4">
        <div className="flex justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold">{destination.name}</h2>
            <span className="text-[var(--primary)] flex items-center gap-1 text-sm">
              <i className="ri-map-pin-fill"></i> {destination.location}
            </span>

            <div className="flex items-center gap-4 text-sm">
              {/* Rating sao */}
              <span className="flex items-center gap-1 text-yellow-500">
                {Array.from({ length: 5 }).map((_, index) => (
                  <i
                    key={index}
                    className={
                      index + 1 <= Math.floor(destination.avgRating ?? 0)
                        ? 'ri-star-fill'
                        : index + 0.5 <= (destination.avgRating ?? 0)
                          ? 'ri-star-half-line'
                          : 'ri-star-line'
                    }
                  />
                ))}
              </span>

              {/* Số service */}
              <span className="text-[var(--primary)]">
                <i className="ri-cup-fill"></i> {destination.serviceCount} SERVICE
              </span>
            </div>

            {/* Rating + status */}
            <div className="flex gap-4 items-center mt-2">
              <div className="border px-3 py-1 rounded-md text-[var(--primary)] font-bold">
                {destination.avgRating}
              </div>
              <div className="text-[var(--primary)] font-semibold">
                {destination.status}
              </div>
              <div className="hidden md:block text-gray-500 text-sm">
                {destination.reviewCount} Đánh giá
              </div>
            </div>
          </div>

          {/* Category + distance */}
          <div className="flex flex-col items-end text-sm">
            <div className="bg-[var(--secondary)] text-white px-3 py-1 rounded-md">
              {destination.category}
            </div>
            <p className="mt-2">{destination.distance}</p>
          </div>
        </div>

        {/* Divider */}
        <span className="block h-px bg-gray-300 my-4" />

        {/* Actions */}
        <div className="flex justify-between items-center">
          <i className="ri-heart-fill border border-[var(--primary)] rounded-md p-2 text-[var(--secondary)] cursor-pointer"></i>
          <button
            onClick={handleClick}
            className="btn-primary w-[70%] sm:w-[80%] h-10 rounded-3xl text-white text-sm cursor-pointer"
          >
            XEM CHI TIẾT
          </button>
        </div>
      </div>
    </div>
  );
};

export default DestinationCard;