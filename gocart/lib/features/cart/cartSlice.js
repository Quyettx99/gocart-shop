import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

let debounceTimer = null;

export const uploadCart = createAsyncThunk(
  "cart/uploadCart",
  async ({ getToken }, thunkAPI) => {
    try {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        const { cartItems } = thunkAPI.getState().cart;
        const token = await getToken();
        await axios.post(
          "/api/cart",
          { cart: cartItems },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }, 1000);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async ({ getToken }, thunkAPI) => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);
const cartSlice = createSlice({
  name: "cart",
  initialState: {
    total: 0,
    cartItems: {},
  },
  reducers: {
    addToCart: (state, action) => {
      const { productId } = action.payload;
      if (state.cartItems[productId]) {
        state.cartItems[productId]++;
      } else {
        state.cartItems[productId] = 1;
      }
      state.total += 1;
    },
    removeFromCart: (state, action) => {
      const { productId } = action.payload;
      if (state.cartItems[productId]) {
        state.cartItems[productId]--;
        if (state.cartItems[productId] === 0) {
          // Tạo object mới thay vì delete để tránh lỗi Immer
          const newCartItems = { ...state.cartItems };
          delete newCartItems[productId];
          state.cartItems = newCartItems;
        }
      }
      state.total -= 1;
    },
    deleteItemFromCart: (state, action) => {
      const { productId } = action.payload;
      const quantity = state.cartItems[productId] || 0;
      state.total -= quantity;
      // Tạo object mới thay vì delete để tránh lỗi Immer
      const newCartItems = { ...state.cartItems };
      delete newCartItems[productId];
      state.cartItems = newCartItems;
    },
    clearCart: (state) => {
      state.cartItems = {};
      state.total = 0;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchCart.fulfilled, (state, action) => {
      // Đảm bảo cart là object, không phải array hoặc null
      const cart = action.payload?.cart || {};
      if (typeof cart === "object" && !Array.isArray(cart) && cart !== null) {
        state.cartItems = { ...cart };
        state.total = Object.values(cart).reduce((acc, item) => {
          const value = typeof item === "number" ? item : 0;
          return acc + value;
        }, 0);
      } else {
        // Nếu cart không hợp lệ, reset về empty
        state.cartItems = {};
        state.total = 0;
      }
    });
  },
});

export const { addToCart, removeFromCart, clearCart, deleteItemFromCart } =
  cartSlice.actions;

export default cartSlice.reducer;
