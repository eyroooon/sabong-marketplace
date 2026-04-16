import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary text-secondary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-4 md:gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <h3 className="flex items-center gap-1.5 text-lg font-bold">
              <span className="text-primary">Bloodline</span>
              <span className="rounded-md bg-gradient-to-br from-[#fbbf24] to-[#dc2626] px-1.5 py-0.5 text-xs font-black text-white">
                PH
              </span>
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              The #1 trusted online marketplace for gamefowl in the Philippines.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold">Categories</h4>
            <ul className="mt-3 space-y-2 text-sm text-gray-400">
              <li><Link href="/listings?category=rooster" className="hover:text-white">Roosters</Link></li>
              <li><Link href="/listings?category=hen" className="hover:text-white">Hens</Link></li>
              <li><Link href="/listings?category=stag" className="hover:text-white">Stags</Link></li>
              <li><Link href="/listings?category=pullet" className="hover:text-white">Pullets</Link></li>
              <li><Link href="/listings?category=pair" className="hover:text-white">Pairs</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold">Support</h4>
            <ul className="mt-3 space-y-2 text-sm text-gray-400">
              <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
              <li><Link href="/safety" className="hover:text-white">Safety Tips</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold">Legal</h4>
            <ul className="mt-3 space-y-2 text-sm text-gray-400">
              <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/guidelines" className="hover:text-white">Community Guidelines</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-700 pt-8 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} BloodlinePH. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
