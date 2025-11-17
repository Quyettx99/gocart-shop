'use client'
import { assets } from "@/assets/assets"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import Image from "next/image"
import { useState } from "react"
import { toast } from "react-hot-toast"

export default function StoreAddProduct() {

    const categories = ['Điện tử', 'Thời trang', 'Nhà cửa & Bếp', 'Làm đẹp & Sức khỏe', 'Đồ chơi & Trò chơi', 'Thể thao & Ngoài trời', 'Sách & Media', 'Thực phẩm & Đồ uống', 'Sở thích & Thủ công', 'Khác']

    const [images, setImages] = useState({ 1: null, 2: null, 3: null, 4: null })
    const [productInfo, setProductInfo] = useState({
        name: "",
        description: "",
        mrp: 0,
        price: 0,
        category: "",
    })
    const [loading, setLoading] = useState(false)
    const [aiUsed,setAiUsed] = useState(false)

    const {getToken} = useAuth()
    const onChangeHandler = (e) => {
        setProductInfo({ ...productInfo, [e.target.name]: e.target.value })
    }

    const handleImageUpload = async (key,file)=>{
        setImages(prev=>({...prev,[key]: file}))
        if(key === "1" && file && !aiUsed){
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onloadend = async () =>{
                const base64String = reader.result.split(",")[1]
                const mimeType = file.type
                const token = await getToken()
                try {
                    await toast.promise(
                        axios.post('/api/store/ai',{base64Image: base64String,mimeType},
                            {headers: {Authorization: `Bearer ${token}`}}),
                            {
                                loading:"Đang phân tích hình ảnh với AI...",
                                success: (res)=>{
                                    const data = res.data
                                    if(data.name && data.description){
                                        setProductInfo(prev =>({
                                            ...prev,
                                            name: data.name,
                                            description: data.description
                                        }))
                                        setAiUsed(true)
                                        return "AI đã điền thông tin sản phẩm"
                                    }
                                    return "AI không thể phân tích hình ảnh"
                                },
                                error: (err)=>err?.response?.data?.error || err.message
                            }
                    )
                } catch (error) {
                    console.error(error)
                }
            }
        }
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        try {
            if(!images[1] && !images[2] && !images[3] && !images[4]){
                return toast.error("Vui lòng tải lên ít nhất một hình ảnh")
            }
            setLoading(true)
            const formData = new FormData()
            formData.append("name", productInfo.name)
            formData.append("description", productInfo.description)
            formData.append("mrp", productInfo.mrp)
            formData.append("price", productInfo.price)
            formData.append("category", productInfo.category)

            Object.keys(images).forEach((key) => {
                images[key]  && formData.append("images", images[key])
            })
            const token = await getToken()
            const {data} = await axios.post('/api/store/product', formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            toast.success(data.message)

            setProductInfo({
                name: "",
                description: "",
                mrp: 0,
                price: 0,
                category: "",
            })
            setImages({ 1: null, 2: null, 3: null, 4: null })
            
        } catch (error) {
            toast.error(error.response?.data?.error || "Có lỗi xảy ra")
        }
        finally{
            setLoading(false)
        }
    }


    return (
        <form onSubmit={e => toast.promise(onSubmitHandler(e), { loading: "Đang thêm sản phẩm..." })} className="text-slate-500 mb-28">
            <h1 className="text-2xl">Thêm sản phẩm <span className="text-slate-800 font-medium">mới</span></h1>
            <p className="mt-7">Hình ảnh sản phẩm</p>

            <div htmlFor="" className="flex gap-3 mt-4">
                {Object.keys(images).map((key) => (
                    <label key={key} htmlFor={`images${key}`}>
                        <Image width={300} height={300} className='h-15 w-auto border border-slate-200 rounded cursor-pointer' src={images[key] ? URL.createObjectURL(images[key]) : assets.upload_area} alt="" />
                        <input type="file" accept='image/*' id={`images${key}`} onChange={e => handleImageUpload(key, e.target.files[0])} hidden />
                    </label>
                ))}
            </div>

            <label htmlFor="" className="flex flex-col gap-2 my-6 ">
                Tên sản phẩm
                <input type="text" name="name" onChange={onChangeHandler} value={productInfo.name} placeholder="Nhập tên sản phẩm" className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded" required />
            </label>

            <label htmlFor="" className="flex flex-col gap-2 my-6 ">
                Mô tả sản phẩm
                <textarea name="description" onChange={onChangeHandler} value={productInfo.description} placeholder="Nhập mô tả sản phẩm" rows={5} className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded resize-none" required />
            </label>

            <div className="flex gap-5">
                <label htmlFor="" className="flex flex-col gap-2 ">
                    Giá gốc ($)
                    <input type="number" name="mrp" onChange={onChangeHandler} value={productInfo.mrp} placeholder="0" rows={5} className="w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded resize-none" required />
                </label>
                <label htmlFor="" className="flex flex-col gap-2 ">
                    Giá khuyến mãi ($)
                    <input type="number" name="price" onChange={onChangeHandler} value={productInfo.price} placeholder="0" rows={5} className="w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded resize-none" required />
                </label>
            </div>

            <select onChange={e => setProductInfo({ ...productInfo, category: e.target.value })} value={productInfo.category} className="w-full max-w-sm p-2 px-4 my-6 outline-none border border-slate-200 rounded" required>
                <option value="">Chọn danh mục</option>
                {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                ))}
            </select>

            <br />

            <button disabled={loading} className="bg-slate-800 text-white px-6 mt-7 py-2 hover:bg-slate-900 rounded transition">Thêm sản phẩm</button>
        </form>
    )
}
