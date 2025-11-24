'use client'
import ProductCard from "@/components/ProductCard"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { MailIcon, MapPinIcon, StarIcon, ShoppingBagIcon } from "lucide-react"
import Loading from "@/components/Loading"
import Image from "next/image"
import axios from "axios"
import toast from "react-hot-toast"

export default function StoreShop() {

    const { username } = useParams()
    const [products, setProducts] = useState([])
    const [storeInfo, setStoreInfo] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchStoreData = async () => {
        try {
            const {data} = await axios.get(`/api/store/data?username=${username}`)
            setStoreInfo(data.store)
            setProducts(data.store.Product)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchStoreData()
    }, [])

    return !loading ? (
        <div className="min-h-[70vh] mx-6">

            {/* Store Info Banner */}
            {storeInfo && (
                <div className="max-w-7xl mx-auto bg-slate-50 rounded-xl p-6 md:p-10 mt-6 flex flex-col md:flex-row items-center gap-6 shadow-xs">
                    <Image
                        src={storeInfo.logo}
                        alt={storeInfo.name}
                        className="size-32 sm:size-38 object-cover border-2 border-slate-100 rounded-md"
                        width={200}
                        height={200}
                    />
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-semibold text-slate-800">{storeInfo.name}</h1>
                        <p className="text-sm text-slate-600 mt-2 max-w-lg">{storeInfo.description}</p>
                        <div className="text-xs text-slate-500 mt-4 space-y-1"></div>
                        <div className="space-y-2 text-sm text-slate-500">
                            <div className="flex items-center">
                                <MapPinIcon className="w-4 h-4 text-gray-500 mr-2" />
                                <span>{storeInfo.address}</span>
                            </div>
                            <div className="flex items-center">
                                <MailIcon className="w-4 h-4 text-gray-500 mr-2" />
                                <span>{storeInfo.email}</span>
                            </div>
                        </div>
                        
                        {/* Store Stats */}
                        <div className="flex flex-wrap gap-4 mt-4">
                            {storeInfo.averageRating !== undefined && storeInfo.averageRating > 0 && (
                                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                                    <StarIcon className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">
                                            {typeof storeInfo.averageRating === 'number' 
                                              ? storeInfo.averageRating.toFixed(1) 
                                              : storeInfo.averageRating}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {storeInfo.totalRatings || 0} đánh giá
                                        </p>
                                    </div>
                                </div>
                            )}
                            {storeInfo.totalSold !== undefined && (
                                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                                    <ShoppingBagIcon className="w-5 h-5 text-green-600" />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">
                                            {storeInfo.totalSold.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-slate-500">sản phẩm đã bán</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Products */}
            <div className=" max-w-7xl mx-auto mb-40">
                <h1 className="text-2xl mt-12">Shop <span className="text-slate-800 font-medium">Products</span></h1>
                <div className="mt-5 grid grid-cols-2 sm:flex flex-wrap gap-6 xl:gap-12 mx-auto">
                    {products.map((product) => <ProductCard key={product.id} product={product} />)}
                </div>
            </div>
        </div>
    ) : <Loading />
}