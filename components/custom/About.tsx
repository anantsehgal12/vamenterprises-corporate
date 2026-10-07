import { Clock3, Mail, MapPin, Phone } from "lucide-react";

export default function About() {
  return (
    <section className="bg-gradient-to-b py-35 from-[#FFFFFF] to-[#5b8363] text-center">
      <h1 className="text-7xl font-bold bg-gradient-to-b from-black to-[#254f13] text-transparent bg-clip-text py-10">About Us</h1>
      <div className="mt-10 flex justify-center px-5">
        {/* Main Card */}
        <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-xl lg:grid-cols-2">
          {/* LEFT - MAP */}
          <div>
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=80.38720445895852,26.411986127726473,80.39720445895853,26.421986127726476&layer=mapnik&marker=26.416986127726474,80.39220445895852"
              className="h-full min-h-[300px] w-full"
              loading="eager"
              title="Location Map"
              style={{
                border: 0,
                filter: "contrast(0.9) brightness(1.15)",
              }}
              referrerPolicy="no-referrer-when-downgrade"
            />

            <div className="pointer-events-none absolute inset-0" />
          </div>

          {/* RIGHT - INFO */}
          <div className="flex flex-col justify-center p-8 text-left sm:p-12 ">
            <div className="mb-10">
              <h2 className="text-4xl font-black tracking-tight bg-gradient-to-b from-black to-[#254f13] text-transparent bg-clip-text">
                Get In Touch
              </h2>

              <p className="mt-4 text-lg leading-8  font-medium">
                Feel free to contact us anytime [between the given hours]. Our support team is always
                ready to assist you.
              </p>
            </div>

            <div className="space-y-6">
              {/* Address */}
              <div className="flex items-start gap-5 rounded-2xl">
                <div className="shrink-0 rounded-2xl">
                  <MapPin className="h-6 w-6" />
                </div>

                <div>
                  <h3 className="text-lg font-bold">Our Address</h3>
                  <p className="mt-2 leading-7">
                    VAM Enterprises
                    <br />
                    229, Chandel Market, Harjinder Ngr., Near V-Mart, Lal
                    Bangla, Kanpur, Uttar Pradesh India 208007
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-5 rounded-2xl">
                <div className="shrink-0 rounded-2xl">
                  <Phone className="h-6 w-6" />
                </div>

                <div>
                  <h3 className="text-lg font-bold">Phone Number</h3>
                  <p className="mt-2">
                    +91 90263 44433
                    <br />
                    +91 70073 47722
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-5 rounded-2xl">
                <div className="shrink-0 rounded-2xl">
                  <Mail className="h-6 w-6" />
                </div>

                <div>
                  <h3 className="text-lg font-bold">Email Address</h3>
                  <p className="mt-2">info@vam-enterprises.co.in</p>
                </div>
              </div>

              {/* Working Hours */}
              <div className="flex items-start gap-5 rounded-2xl">
                <div className="shrink-0 rounded-2xl">
                  <Clock3 className="h-6 w-6" />
                </div>

                <div>
                  <h3 className="text-lg font-bold">Working Hours</h3>
                  <p className="mt-2 leading-7">
                    Monday - Saturday
                    <br />
                    10:30 AM - 6:30 PM
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}