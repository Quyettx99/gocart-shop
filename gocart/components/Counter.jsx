'use client'
import { addToCart, removeFromCart } from "@/lib/features/cart/cartSlice";
import { useDispatch, useSelector } from "react-redux";

const Counter = ({ productId, disabled = false }) => {

    const { cartItems } = useSelector(state => state.cart);

    const dispatch = useDispatch();

    const addToCartHandler = () => {
        if (disabled) return;
        dispatch(addToCart({ productId }))
    }

    const removeFromCartHandler = () => {
        if (disabled) return;
        dispatch(removeFromCart({ productId }))
    }

    return (
        <div className={`inline-flex items-center gap-1 sm:gap-3 px-3 py-1 rounded border border-slate-200 max-sm:text-sm ${
            disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'text-slate-600'
        }`}>
            <button 
                onClick={removeFromCartHandler} 
                className="p-1 select-none"
                disabled={disabled}
            >
                -
            </button>
            <p className="p-1">{cartItems[productId]}</p>
            <button 
                onClick={addToCartHandler} 
                className="p-1 select-none"
                disabled={disabled}
            >
                +
            </button>
        </div>
    )
}

export default Counter