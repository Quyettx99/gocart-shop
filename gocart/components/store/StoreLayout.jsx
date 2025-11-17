'use client'
import { useEffect, useState } from "react"
import Loading from "../Loading"
import Link from "next/link"
import { ArrowRightIcon, StoreIcon, ClockIcon } from "lucide-react"
import SellerNavbar from "./StoreNavbar"
import SellerSidebar from "./StoreSidebar"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"

const StoreLayout = ({ children }) => {
    const { getToken } = useAuth()

    const [isSeller, setIsSeller] = useState(false)
    const [loading, setLoading] = useState(true)
    const [storeInfo, setStoreInfo] = useState(null)
    const [hasStore, setHasStore] = useState(false)
    const [storeStatus, setStoreStatus] = useState(null)
    const [message, setMessage] = useState("")
    const [error, setError] = useState(null)

    const fetchIsSeller = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/store/is-seller', {
                headers: { Authorization: `Bearer ${token}` }
            })
            
            setIsSeller(data.isSeller || false)
            setStoreInfo(data.storeInfo || null)
            setHasStore(data.hasStore || false)
            setStoreStatus(data.storeStatus || null)
            setMessage(data.message || "")
            setError(null)
        } catch (error) {
            console.error("Error fetching seller status:", error)
            setError(error.response?.data?.error || error.message || "Đã xảy ra lỗi")
            setIsSeller(false)
            setStoreInfo(null)
            setHasStore(false)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchIsSeller()
    }, [])

    if (loading) return <Loading />

    if (error && !hasStore) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
                <h1 className="text-2xl sm:text-4xl font-semibold text-slate-400 mb-4">Lỗi</h1>
                <p className="text-slate-500 mb-8">{error}</p>
                <Link href="/" className="bg-slate-700 text-white flex items-center gap-2 mt-4 p-2 px-6 max-sm:text-sm rounded-full">
                    Về trang chủ <ArrowRightIcon size={18} />
                </Link>
            </div>
        )
    }

    if (isSeller && storeInfo) {
        return (
            <div className="flex flex-col h-screen">
                <SellerNavbar />
                <div className="flex flex-1 items-start h-full overflow-y-scroll no-scrollbar">
                    <SellerSidebar storeInfo={storeInfo} />
                    <div className="flex-1 h-full p-5 lg:pl-12 lg:pt-12 overflow-y-scroll">
                        {children}
                    </div>
                </div>
            </div>
        )
    }

    if (!hasStore) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
                <StoreIcon size={64} className="text-slate-400 mb-6" />
                <h1 className="text-2xl sm:text-4xl font-semibold text-slate-400 mb-4">
                    Bạn chưa có cửa hàng
                </h1>
                <p className="text-slate-500 mb-8 max-w-md">
                    {message || "Tạo cửa hàng để bắt đầu bán sản phẩm trên GoCart."}
                </p>
                <div className="flex gap-4 flex-wrap justify-center">
                    <Link 
                        href="/create-store" 
                        className="bg-slate-800 text-white flex items-center gap-2 px-6 py-3 rounded-full hover:bg-slate-900 transition"
                    >
                        <StoreIcon size={18} />
                        Tạo cửa hàng
                    </Link>
                    <Link 
                        href="/" 
                        className="bg-slate-200 text-slate-700 flex items-center gap-2 px-6 py-3 rounded-full hover:bg-slate-300 transition"
                    >
                        Về trang chủ <ArrowRightIcon size={18} />
                    </Link>
                </div>
            </div>
        )
    }

    if (hasStore && storeStatus && storeStatus !== "approved") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
                <ClockIcon size={64} className="text-slate-400 mb-6" />
                <h1 className="text-2xl sm:text-4xl font-semibold text-slate-400 mb-4">
                    Cửa hàng đang chờ duyệt
                </h1>
                <p className="text-slate-500 mb-4 max-w-md">
                    {message || `Trạng thái cửa hàng của bạn là "${storeStatus}". Vui lòng chờ quản trị viên phê duyệt.`}
                </p>
                {storeStatus === "pending" && (
                    <p className="text-slate-400 text-sm mb-8">
                        Chúng tôi đang xem xét đơn đăng ký cửa hàng của bạn. Bạn sẽ được thông báo khi được phê duyệt.
                    </p>
                )}
                {storeStatus === "rejected" && (
                    <p className="text-red-400 text-sm mb-8">
                        Đơn đăng ký cửa hàng của bạn bị từ chối. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.
                    </p>
                )}
                <div className="flex gap-4 flex-wrap justify-center">
                    <Link 
                        href="/" 
                        className="bg-slate-700 text-white flex items-center gap-2 px-6 py-3 rounded-full hover:bg-slate-800 transition"
                    >
                        Về trang chủ <ArrowRightIcon size={18} />
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
            <h1 className="text-2xl sm:text-4xl font-semibold text-slate-400">Bạn không được phép truy cập trang này</h1>
            <p className="text-slate-500 mt-4 mb-8">{message}</p>
            <Link href="/" className="bg-slate-700 text-white flex items-center gap-2 mt-4 p-2 px-6 max-sm:text-sm rounded-full">
                Về trang chủ <ArrowRightIcon size={18} />
            </Link>
        </div>
    )
}

export default StoreLayout
