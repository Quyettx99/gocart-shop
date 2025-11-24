import { Facebook, Mail, MapPin, Phone } from "lucide-react";
import ContactForm from "@/components/ContactForm";

export const metadata = {
  title: "Liên hệ | gocart",
};

export default function ContactPage() {
  return (
    <section className="bg-white">
      <div className="max-w-6xl mx-auto px-6 lg:px-0 py-16 grid gap-12 lg:grid-cols-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Liên hệ với chúng tôi
          </h1>
          <p className="mt-4 text-slate-600 leading-relaxed">
            Bạn có thể liên hệ với chúng tôi bằng cách nào mà bạn cảm
            thấy phù hợp nhất. Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn.
          </p>

          <div className="mt-8 space-y-4 text-slate-700">
            <h2 className="font-semibold uppercase text-slate-900">
              CÔNG TY KINH TE 
            </h2>
            <div className="flex items-start gap-3">
              <MapPin className="text-red-500 min-w-5 mt-0.5" size={18} />
              <p>
                Địa chỉ: Tầng 11, Tòa nhà HA10, Ngõ 218 Lĩnh Nam, Hoàng Mai, Hà Nội
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="text-red-500" size={18} />
              <p>Di động / Zalo: 0868.686.868</p>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="text-red-500" size={18} />
              <p>Email: ndq@gmail.com</p>
            </div>
            <div className="flex items-center gap-3">
              <Facebook className="text-red-500" size={18} />
              <p>Fb: facebook.com/ndq</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
            <iframe
              title="Tam Nguyen Media Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3409.9515035739946!2d105.87385911032169!3d20.98306958926657!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ae9fec01edeb%3A0x6796a06df40faf29!2zMjE4IMSQLiBMxKluaCBOYW0sIFbEqW5oIEjGsG5nLCBIYWkgQsOgIFRyxrBuZywgSMOgIE7hu5lpLCBWaeG7h3QgTmFt!5e1!3m2!1svi!2s!4v1763733491005!5m2!1svi!2s"
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
            ></iframe>
          </div>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}
