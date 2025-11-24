"use client";
import Image from "next/image";
import { DotIcon } from "lucide-react";
import { useSelector } from "react-redux";
import Rating from "./Rating";
import { useState } from "react";
import RatingModal from "./RatingModal";

const OrderItem = ({ order }) => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "VND";
  const [ratingModal, setRatingModal] = useState(null);
  const { ratings } = useSelector((state) => state.rating);

  const orderStatusText = {
    ORDER_PLACED: "Đã đặt hàng",
    PROCESSING: "Đang xử lý",
    SHIPPED: "Đã vận chuyển",
    DELIVERED: "Đã giao hàng",
  };

  // Hàm lấy màu sắc cho trạng thái
  const getStatusColor = (status) => {
    const statusUpper = status.toUpperCase();
    if (statusUpper === "ORDER_PLACED") return "text-yellow-500 bg-yellow-100";
    if (statusUpper === "PROCESSING") return "text-blue-500 bg-blue-100";
    if (statusUpper === "SHIPPED") return "text-orange-500 bg-orange-100";
    if (statusUpper === "DELIVERED") return "text-green-500 bg-green-100";
    return "text-slate-500 bg-slate-100";
  };

  return (
    <>
      <tr className="text-sm">
        <td className="text-left">
          <div className="flex flex-col gap-6">
            {order.orderItems.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-20 aspect-square bg-slate-100 flex items-center justify-center rounded-md">
                  <Image
                    className="h-14 w-auto"
                    src={item.product.images[0]}
                    alt="product_img"
                    width={50}
                    height={50}
                  />
                </div>
                <div className="flex flex-col justify-center text-sm">
                  <p className="font-medium text-slate-600 text-base">
                    {item.product.name}
                  </p>
                  <p>
                    {item.price.toLocaleString("vi-VN")} {currency} Số lượng:{" "}
                    {item.quantity}{" "}
                  </p>
                  <p className="mb-1">
                    {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                  <div>
                    {ratings.find(
                      (rating) =>
                        order.id === rating.orderId &&
                        item.product.id === rating.productId
                    ) ? (
                      <Rating
                        value={
                          ratings.find(
                            (rating) =>
                              order.id === rating.orderId &&
                              item.product.id === rating.productId
                          ).rating
                        }
                      />
                    ) : (
                      <button
                        onClick={() =>
                          setRatingModal({
                            orderId: order.id,
                            productId: item.product.id,
                          })
                        }
                        className={`text-green-500 hover:bg-green-50 transition ${
                          order.status.toUpperCase() !== "DELIVERED" && "hidden"
                        }`}
                      >
                        Đánh giá sản phẩm
                      </button>
                    )}
                  </div>
                  {ratingModal && (
                    <RatingModal
                      ratingModal={ratingModal}
                      setRatingModal={setRatingModal}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </td>

        <td className="text-center max-md:hidden">
          {order.total.toLocaleString("vi-VN")} {currency}
        </td>

        <td className="text-left max-md:hidden">
          <p>
            {order.address.name}, {order.address.street},
          </p>
          <p>
            {order.address.city}, {order.address.state}, {order.address.zip},{" "}
            {order.address.country},
          </p>
          <p>{order.address.phone}</p>
        </td>

        <td className="text-left space-y-2 text-sm max-md:hidden">
          <div
            className={`flex items-center justify-center gap-1 rounded-full p-1 ${getStatusColor(
              order.status
            )}`}
          >
            <DotIcon size={10} className="scale-250" />
            {orderStatusText[order.status.toUpperCase()] || order.status}
          </div>
        </td>
      </tr>
      {/* Mobile */}
      <tr className="md:hidden">
        <td colSpan={5}>
          <p>
            {order.address.name}, {order.address.street}
          </p>
          <p>
            {order.address.city}, {order.address.state}, {order.address.zip},{" "}
            {order.address.country}
          </p>
          <p>{order.address.phone}</p>
          <br />
          <div className="flex items-center">
            <span
              className={`text-center mx-auto px-6 py-1.5 rounded ${getStatusColor(
                order.status
              )}`}
            >
              {orderStatusText[order.status.toUpperCase()] || order.status}
            </span>
          </div>
        </td>
      </tr>
      <tr>
        <td colSpan={4}>
          <div className="border-b border-slate-300 w-6/7 mx-auto" />
        </td>
      </tr>
    </>
  );
};

export default OrderItem;
