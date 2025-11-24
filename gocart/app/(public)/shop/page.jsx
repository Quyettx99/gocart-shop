"use client";
import { Suspense, useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import { MoveLeftIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";

// Hàm tính điểm liên quan (relevance score) - di chuyển ra ngoài để tối ưu performance
const calculateRelevanceScore = (product, searchTerms) => {
  let score = 0;
  const nameLower = product.name?.toLowerCase() || "";
  const descriptionLower = product.description?.toLowerCase() || "";
  const categoryLower = product.category?.toLowerCase() || "";
  const searchText = searchTerms.join(" ").toLowerCase();

  // Tìm kiếm trong name, description, category
  const searchableText = `${nameLower} ${descriptionLower} ${categoryLower}`;

  // Điểm cho khớp chính xác toàn bộ từ khóa
  if (nameLower.includes(searchText)) {
    score += 100;
  }
  if (descriptionLower.includes(searchText)) {
    score += 50;
  }
  if (categoryLower.includes(searchText)) {
    score += 30;
  }

  // Điểm cho từng từ khóa riêng lẻ
  searchTerms.forEach((term) => {
    const termLower = term.toLowerCase();

    // Khớp chính xác từ trong name
    if (nameLower.includes(termLower)) {
      score += 20;
      // Bonus nếu từ ở đầu tên
      if (nameLower.startsWith(termLower)) {
        score += 10;
      }
    }

    // Khớp chính xác từ trong description
    if (descriptionLower.includes(termLower)) {
      score += 10;
    }

    // Khớp chính xác từ trong category
    if (categoryLower.includes(termLower)) {
      score += 15;
    }

    // Tìm kiếm gần đúng (fuzzy) - từ có chứa một phần của từ tìm kiếm
    const words = searchableText.split(/\s+/);
    words.forEach((word) => {
      if (word.includes(termLower) && word !== termLower) {
        score += 5; // Điểm thấp hơn cho fuzzy match
      }
      // Tương tự, từ tìm kiếm có chứa một phần của từ trong sản phẩm
      if (termLower.includes(word) && word.length >= 3) {
        score += 3;
      }
    });
  });

  return score;
};

function ShopContent() {
  // get query params ?search=abc
  const searchParams = useSearchParams();
  const search = searchParams.get("search");
  const category = searchParams.get("category");
  const router = useRouter();

  const products = useSelector((state) => state.product.list);

  // Nhóm sản phẩm theo category
  const productsByCategory = useMemo(() => {
    let filtered = products;

    // Lọc theo search với tìm kiếm nâng cao
    if (search) {
      const searchTerms = search
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter((term) => term.length > 0);

      if (searchTerms.length > 0) {
        // Tính điểm relevance cho mỗi sản phẩm
        const productsWithScore = products.map((product) => ({
          product,
          score: calculateRelevanceScore(product, searchTerms),
        }));

        // Lọc các sản phẩm có điểm > 0 (có liên quan)
        filtered = productsWithScore
          .filter((item) => item.score > 0)
          .sort((a, b) => b.score - a.score) // Sắp xếp theo điểm giảm dần
          .map((item) => item.product);
      }
    }

    // Lọc theo category nếu có
    if (category) {
      filtered = filtered.filter(
        (product) => product.category?.toLowerCase() === category.toLowerCase()
      );
    }

    // Nhóm theo category
    const grouped = {};
    filtered.forEach((product) => {
      const cat = product.category || "Khác";
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(product);
    });

    // Sắp xếp categories theo thứ tự xuất hiện
    const categories = [
      "Điện tử",
      "Thời trang",
      "Nhà cửa & Bếp",
      "Làm đẹp & Sức khỏe",
      "Đồ chơi & Trò chơi",
      "Thể thao & Ngoài trời",
      "Sách & Media",
      "Thực phẩm & Đồ uống",
      "Sở thích & Thủ công",
      "Khác",
    ];

    // Sắp xếp theo thứ tự định sẵn, các category khác đặt cuối
    const sortedCategories = [
      ...categories.filter((cat) => grouped[cat]),
      ...Object.keys(grouped).filter((cat) => !categories.includes(cat)),
    ];

    return { grouped, sortedCategories };
  }, [products, search, category]);

  return (
    <div className="min-h-[70vh] mx-6">
      <div className="max-w-7xl mx-auto">
        <h1
          onClick={() => router.push("/shop")}
          className="text-2xl text-slate-500 my-6 flex items-center gap-2 cursor-pointer"
        >
          {search && <MoveLeftIcon size={20} />}
          {category
            ? `Danh mục: ${category}`
            : search
            ? `Kết quả tìm kiếm: ${search}`
            : "Tất cả"}{" "}
          <span className="text-slate-700 font-medium">sản phẩm</span>
        </h1>

        {productsByCategory.sortedCategories.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p>Không tìm thấy sản phẩm nào</p>
          </div>
        ) : (
          productsByCategory.sortedCategories.map((categoryName) => {
            const categoryProducts = productsByCategory.grouped[categoryName];
            if (!categoryProducts || categoryProducts.length === 0) return null;

            return (
              <div key={categoryName} className="mb-16">
                <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                  <span className="w-1 h-6 bg-green-600 rounded-full"></span>
                  {categoryName}
                  <span className="text-sm font-normal text-slate-500">
                    ({categoryProducts.length} sản phẩm)
                  </span>
                </h2>
                <div className="grid grid-cols-2 sm:flex flex-wrap gap-6 xl:gap-12">
                  {categoryProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function Shop() {
  return (
    <Suspense fallback={<div>Đang tải cửa hàng...</div>}>
      <ShopContent />
    </Suspense>
  );
}
