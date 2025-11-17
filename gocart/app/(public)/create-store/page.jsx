"use client";
import { assets } from "@/assets/assets";
import { useEffect, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import Loading from "@/components/Loading";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function CreateStore() {
  const { user } = useUser();
  const router = useRouter();
  const { getToken } = useAuth();
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [storeInfo, setStoreInfo] = useState({
    name: "",
    username: "",
    description: "",
    email: "",
    contact: "",
    address: "",
    image: "",
  });

  const onChangeHandler = (e) => {
    setStoreInfo({ ...storeInfo, [e.target.name]: e.target.value });
  };

  const fetchSellerStatus = async () => {
    const token = await getToken();
    try {
      const { data } = await axios.get("/api/store/create", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (["approved", "rejected", "pending"].includes(data.status)) {
        setStatus(data.status);
        setAlreadySubmitted(true);
        switch (data.status) {
          case "approved":
            setMessage(
              "Cửa hàng của bạn đã được phê duyệt, bạn có thể thêm sản phẩm vào cửa hàng từ bảng điều khiển"
            );
            setTimeout(() => router.push("/store"), 500);
            break;
          case "rejected":
            setMessage(
              "Yêu cầu cửa hàng của bạn đã bị từ chối, bạn có thể liên hệ bộ phận hỗ trợ để biết thêm chi tiết"
            );
            break;
          case "pending":
            setMessage(
              "Yêu cầu cửa hàng của bạn đang chờ phê duyệt, vui lòng đợi quản trị viên xác nhận"
            );
            break;
          default:
            break;
        }
      } else {
        setAlreadySubmitted(false);
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
    }
    setLoading(false);
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!user) {
      return toast("Vui lòng đăng nhập để tiếp tục");
    }
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("name", storeInfo.name);
      formData.append("username", storeInfo.username);
      formData.append("description", storeInfo.description);
      formData.append("email", storeInfo.email);
      formData.append("contact", storeInfo.contact);
      formData.append("address", storeInfo.address);
      formData.append("image", storeInfo.image);

      const { data } = await axios.post("/api/store/create", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(data.message);
      await fetchSellerStatus();
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSellerStatus();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-[80vh] mx-6 flex items-center justify-center text-slate-400">
        <h1 className="text-2xl sm:text-4xl font-semibold">
          Vui lòng{" "}
          <span className="text-slate-500">đăng nhập</span> để tiếp tục
        </h1>
      </div>
    );
  }

  return !loading ? (
    <>
      {!alreadySubmitted ? (
        <div className="mx-6 min-h-[70vh] my-16">
          <form
            onSubmit={(e) =>
              toast.promise(onSubmitHandler(e), {
                loading: "Đang gửi dữ liệu...",
              })
            }
            className="max-w-7xl mx-auto flex flex-col items-start gap-3 text-slate-500"
          >
            {/* Title */}
            <div>
              <h1 className="text-3xl ">
                Thêm cửa hàng{" "}
                <span className="text-slate-800 font-medium">của bạn</span>
              </h1>
              <p className="max-w-lg">
                Để trở thành người bán hàng trên GoCart, hãy gửi chi tiết cửa
                hàng của bạn để được xem xét. Cửa hàng của bạn sẽ được kích hoạt
                sau khi quản trị viên xác nhận.
              </p>
            </div>

            <label className="mt-10 cursor-pointer">
              Logo cửa hàng
              <Image
                src={
                  storeInfo.image
                    ? URL.createObjectURL(storeInfo.image)
                    : assets.upload_area
                }
                className="rounded-lg mt-2 h-16 w-auto"
                alt=""
                width={150}
                height={100}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setStoreInfo({ ...storeInfo, image: e.target.files[0] })
                }
                hidden
              />
            </label>

            <p>Tên đăng nhập</p>
            <input
              name="username"
              onChange={onChangeHandler}
              value={storeInfo.username}
              type="text"
              placeholder="Nhập tên đăng nhập cửa hàng"
              className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
            />

            <p>Tên cửa hàng</p>
            <input
              name="name"
              onChange={onChangeHandler}
              value={storeInfo.name}
              type="text"
              placeholder="Nhập tên cửa hàng"
              className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
            />

            <p>Mô tả cửa hàng</p>
            <textarea
              name="description"
              onChange={onChangeHandler}
              value={storeInfo.description}
              rows={5}
              placeholder="Nhập mô tả cửa hàng"
              className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded resize-none"
            />

            <p>Email cửa hàng</p>
            <input
              name="email"
              onChange={onChangeHandler}
              value={storeInfo.email}
              type="email"
              placeholder="Nhập email cửa hàng"
              className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
            />

            <p>Số liên hệ</p>
            <input
              name="contact"
              onChange={onChangeHandler}
              value={storeInfo.contact}
              type="text"
              placeholder="Nhập số liên hệ cửa hàng"
              className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
            />

            <p>Địa chỉ cửa hàng</p>
            <textarea
              name="address"
              onChange={onChangeHandler}
              value={storeInfo.address}
              rows={5}
              placeholder="Nhập địa chỉ cửa hàng"
              className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded resize-none"
            />

            <button className="bg-slate-800 text-white px-12 py-2 rounded mt-10 mb-40 active:scale-95 hover:bg-slate-900 transition ">
              Gửi
            </button>
          </form>
        </div>
      ) : (
        <div className="min-h-[80vh] flex flex-col items-center justify-center">
          <p className="sm:text-2xl lg:text-3xl mx-5 font-semibold text-slate-500 text-center max-w-2xl">
            {message}
          </p>
          {status === "approved" && (
            <p className="mt-5 text-slate-400">
              Chuyển hướng đến trang điều khiển trong{" "}
              <span className="font-semibold">5 giây</span>
            </p>
          )}
        </div>
      )}
    </>
  ) : (
    <Loading />
  );
}
