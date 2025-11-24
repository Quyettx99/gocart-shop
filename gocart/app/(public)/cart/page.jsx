"use client";
import Counter from "@/components/Counter";
import OrderSummary from "@/components/OrderSummary";
import PageTitle from "@/components/PageTitle";
import { deleteItemFromCart } from "@/lib/features/cart/cartSlice";
import { Trash2Icon, AlertCircleIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

export default function Cart() {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "VND";

  const { cartItems } = useSelector((state) => state.cart);
  const products = useSelector((state) => state.product.list);

  const dispatch = useDispatch();

  const [cartArray, setCartArray] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [stockStatus, setStockStatus] = useState({});
  const [loadingStock, setLoadingStock] = useState(false);

  // Kiểm tra trạng thái tồn kho
  const checkStockStatus = async () => {
    const productIds = Object.keys(cartItems);
    if (productIds.length === 0) {
      setStockStatus({});
      return;
    }

    setLoadingStock(true);
    try {
      const { data } = await axios.post("/api/products/check-stock", {
        productIds,
      });
      setStockStatus(data.stockStatus || {});
    } catch (error) {
      console.error("Lỗi khi kiểm tra tồn kho:", error);
      // Nếu có lỗi, vẫn tiếp tục với stockStatus rỗng để không block UI
      setStockStatus({});
    } finally {
      setLoadingStock(false);
    }
  };

  const createCartArray = () => {
    setTotalPrice(0);
    const cartArray = [];
    for (const [key, value] of Object.entries(cartItems)) {
      const product = products.find((product) => product.id === key);
      const stockInfo = stockStatus[key];

      if (product) {
        // Sản phẩm có trong danh sách products
        const isOutOfStock = stockInfo?.inStock === false;
        cartArray.push({
          ...product,
          quantity: value,
          isOutOfStock,
        });
        // Chỉ tính giá nếu sản phẩm còn hàng
        if (!isOutOfStock) {
          setTotalPrice((prev) => prev + product.price * value);
        }
      } else if (stockInfo) {
        // Sản phẩm không có trong danh sách nhưng có trong stockStatus
        // (có thể đã bị xóa khỏi danh sách vì hết hàng hoặc store inactive)
        cartArray.push({
          id: key,
          name: stockInfo.name || "Sản phẩm không tìm thấy",
          images:
            stockInfo.images && stockInfo.images.length > 0
              ? stockInfo.images
              : ["/placeholder-image.png"],
          category: stockInfo.category || "",
          price: stockInfo.price || 0,
          quantity: value,
          isOutOfStock: !stockInfo.inStock,
        });
      }
      // Nếu không tìm thấy trong cả products và stockStatus, bỏ qua
      // (sẽ được xử lý khi stockStatus được cập nhật)
    }
    setCartArray(cartArray);
  };

  const handleDeleteItemFromCart = (productId) => {
    dispatch(deleteItemFromCart({ productId }));
  };

  useEffect(() => {
    checkStockStatus();
  }, [cartItems]);

  useEffect(() => {
    // Tạo cart array khi có products hoặc khi stockStatus đã được kiểm tra
    // (ngay cả khi stockStatus rỗng, vẫn cần tạo cart array từ products)
    createCartArray();
  }, [cartItems, products, stockStatus]);

  return cartArray.length > 0 ? (
    <div className="min-h-screen mx-6 text-slate-800">
      <div className="max-w-7xl mx-auto ">
        {/* Title */}
        <PageTitle
          heading="Giỏ hàng của tôi"
          text="sản phẩm trong giỏ hàng"
          linkText="Thêm sản phẩm"
        />

        <div className="flex items-start justify-between gap-5 max-lg:flex-col">
          <table className="w-full max-w-4xl text-slate-600 table-auto">
            <thead>
              <tr className="max-sm:text-sm">
                <th className="text-left">Sản phẩm</th>
                <th>Số lượng</th>
                <th>Tổng giá</th>
                <th className="max-md:hidden">Xóa</th>
              </tr>
            </thead>
            <tbody>
              {cartArray.map((item, index) => {
                const isOutOfStock = item.isOutOfStock === true;
                return (
                  <tr
                    key={index}
                    className={`space-x-2 ${
                      isOutOfStock ? "opacity-60 bg-red-50/30" : ""
                    }`}
                  >
                    <td className="flex gap-3 my-4">
                      <div className="flex gap-3 items-center justify-center bg-slate-100 size-18 rounded-md">
                        <Image
                          src={item.images[0] || "/placeholder-image.png"}
                          className="h-14 w-auto"
                          alt=""
                          width={45}
                          height={45}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start gap-2">
                          <p className="max-sm:text-sm">{item.name}</p>
                          {isOutOfStock && (
                            <AlertCircleIcon
                              className="text-red-500 flex-shrink-0 mt-0.5"
                              size={18}
                            />
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {item.category}
                        </p>
                        <p>
                          {item.price > 0
                            ? `${item.price} ${currency}`
                            : "Giá không khả dụng"}
                        </p>
                        {isOutOfStock && (
                          <div className="mt-2 flex items-center gap-1 text-red-600 text-xs font-medium">
                            <AlertCircleIcon size={14} />
                            <span>Sản phẩm đã hết hàng, không thể mua</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      <Counter productId={item.id} disabled={isOutOfStock} />
                    </td>
                    <td className="text-center">
                      {isOutOfStock ? (
                        <span className="text-red-500 text-sm">
                          Không khả dụng
                        </span>
                      ) : (
                        `${(
                          item.price * item.quantity
                        ).toLocaleString()} ${currency}`
                      )}
                    </td>
                    <td className="text-center max-md:hidden">
                      <button
                        onClick={() => handleDeleteItemFromCart(item.id)}
                        className=" text-red-500 hover:bg-red-50 p-2.5 rounded-full active:scale-95 transition-all"
                      >
                        <Trash2Icon size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <OrderSummary
            totalPrice={totalPrice}
            items={cartArray}
            stockStatus={stockStatus}
          />
        </div>
      </div>
    </div>
  ) : (
    <div className="min-h-[80vh] mx-6 flex items-center justify-center text-slate-400">
      <h1 className="text-2xl sm:text-4xl font-semibold">
        Giỏ hàng của bạn trống
      </h1>
    </div>
  );
}
