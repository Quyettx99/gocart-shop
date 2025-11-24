"use client";
import { PackageIcon, Search, ShoppingCart, StoreIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useUser, useClerk, UserButton, Protect } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";

const Navbar = () => {
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const { getToken } = useAuth();
  const router = useRouter();
  const [storeUsername, setStoreUsername] = useState(null);

  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);
  const cartCount = useSelector((state) => state.cart.total);

  // Debounce để gọi API suggestions
  useEffect(() => {
    if (search.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const response = await fetch(
          `/api/search-suggestions?q=${encodeURIComponent(search)}`
        );
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timer);
  }, [search]);

  // Đóng suggestions khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    router.push(`/shop?search=${search}`);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearch(suggestion);
    setShowSuggestions(false);
    router.push(`/shop?search=${suggestion}`);
  };

  // Lấy thông tin store của user
  useEffect(() => {
    const fetchStoreInfo = async () => {
      if (!user) {
        setStoreUsername(null);
        return;
      }
      try {
        const token = await getToken();
        const { data } = await axios.get("/api/store/is-seller", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.hasStore && data.storeInfo && data.storeInfo.username) {
          setStoreUsername(data.storeInfo.username);
        }
      } catch (error) {
        // User không có store hoặc chưa đăng nhập
        setStoreUsername(null);
      }
    };
    fetchStoreInfo();
  }, [user, getToken]);

  return (
    <nav className="relative bg-white">
      <div className="mx-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto py-4 transition-all">
          <Link
            href="/"
            className="relative text-4xl font-semibold text-slate-700"
          >
            <span className="text-green-600">go</span>cart
            <span className="text-green-600 text-5xl leading-0">.</span>
            <Protect plan="plus">
              <p className="absolute text-xs font-semibold -top-1 -right-8 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-green-500">
                plus
              </p>
            </Protect>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden sm:flex items-center gap-4 lg:gap-8 text-slate-600">
            <Link href="/">Trang chủ</Link>
            <Link href="/shop">Cửa hàng</Link>
            <Link href="/">Giới thiệu</Link>
            <Link href="/contact">Liên hệ</Link>

            <div className="hidden xl:block relative" ref={searchRef}>
              <form
                onSubmit={handleSearch}
                className="flex items-center w-xs text-sm gap-2 bg-slate-100 px-4 py-3 rounded-full"
              >
                <Search size={18} className="text-slate-600" />
                <input
                  className="w-full bg-transparent outline-none placeholder-slate-600"
                  type="text"
                  placeholder="Tìm kiếm sản phẩm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  required
                />
              </form>
              {showSuggestions &&
                (suggestions.length > 0 || loadingSuggestions) && (
                  <div
                    ref={suggestionsRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
                  >
                    {loadingSuggestions ? (
                      <div className="px-4 py-3 text-sm text-slate-500">
                        Đang tìm kiếm gợi ý...
                      </div>
                    ) : (
                      suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                        >
                          <Search size={14} className="text-slate-400" />
                          {suggestion}
                        </button>
                      ))
                    )}
                  </div>
                )}
            </div>

            <Link
              href="/cart"
              className="relative flex items-center gap-2 text-slate-600"
            >
              <ShoppingCart size={18} />
              Giỏ hàng
              <button className="absolute -top-1 left-3 text-[8px] text-white bg-slate-600 size-3.5 rounded-full">
                {cartCount}
              </button>
            </Link>

            {!user ? (
              <button
                onClick={openSignIn}
                className="px-8 py-2 bg-indigo-500 hover:bg-indigo-600 transition text-white rounded-full"
              >
                Đăng nhập
              </button>
            ) : (
              <UserButton>
                <UserButton.MenuItems>
                  {storeUsername && (
                    <UserButton.Action
                      labelIcon={<StoreIcon size={16} />}
                      label="Shop của tôi"
                      onClick={() => router.push(`/shop/${storeUsername}`)}
                    />
                  )}
                  <UserButton.Action
                    labelIcon={<PackageIcon size={16} />}
                    label="Đơn hàng của tôi"
                    onClick={() => router.push("/orders")}
                  />
                </UserButton.MenuItems>
              </UserButton>
            )}
          </div>

          {/* Mobile User Button  */}
          <div className="sm:hidden">
            {user ? (
              <div className="flex gap-2">
                <UserButton>
                  <UserButton.MenuItems>
                    <UserButton.Action
                      labelIcon={<ShoppingCart size={16} />}
                      label="Giỏ hàng"
                      onClick={() => router.push("/cart")}
                    />
                  </UserButton.MenuItems>
                </UserButton>
                <UserButton>
                  <UserButton.MenuItems>
                    {storeUsername && (
                      <UserButton.Action
                        labelIcon={<StoreIcon size={16} />}
                        label="Shop của tôi"
                        onClick={() => router.push(`/shop/${storeUsername}`)}
                      />
                    )}
                    <UserButton.Action
                      labelIcon={<PackageIcon size={16} />}
                      label="Đơn hàng của tôi"
                      onClick={() => router.push("/orders")}
                    />
                  </UserButton.MenuItems>
                </UserButton>
              </div>
            ) : (
              <button
                onClick={openSignIn}
                className="px-7 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-sm transition text-white rounded-full"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </div>
      <hr className="border-gray-300" />
    </nav>
  );
};

export default Navbar;
