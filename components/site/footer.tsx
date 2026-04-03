import Image from "next/image";
import Link from "next/link";
import Container from "./container";

export default function Footer() {
  return (
    <footer
      className="mt-20 bg-transparent"

    >
      <Container>
        <div className="grid gap-10 py-14 md:grid-cols-4">
          {/* 品牌区域 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-lg font-semibold  text-(--theme)">
                  Lofty Education
                </h3>
                <p className="text-sm text-gray-500">
                  IELTS · PTE · Academic English
                </p>
              </div>
            </div>

            <p className="text-sm leading-6 text-gray-600">
              Professional IELTS and PTE preparation platform with AI-assisted
              speaking, writing, listening and reading practice.
            </p>
          </div>

          {/* 快速导航 */}
          <div>
            <h4 className="mb-4 text-sm font-semibold  text-(--theme)">
              Quick Links
            </h4>
            <div className="space-y-2 text-sm text-gray-600">
              <Link href="/ielts" className="block hover:text-black">
                IELTS Courses
              </Link>
              <Link href="/pte" className="block hover:text-black">
                PTE Practice
              </Link>
              <Link href="/blog" className="block hover:text-black">
                Blog
              </Link>
              <Link href="/contact" className="block hover:text-black">
                Contact
              </Link>
            </div>
          </div>

          {/* SEO关键词区域 */}
          <div>
            <h4 className="mb-4 text-sm font-semibold  text-(--theme)">
              Popular Topics
            </h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p>IELTS Writing Task 2</p>
              <p>PTE Speaking Templates</p>
              <p>IELTS Listening Practice</p>
              <p>Academic Vocabulary</p>
            </div>
          </div>

          {/* 联系信息 */}
          <div>
            <h4 className="mb-4 text-sm font-semibold  text-(--theme)">
              Contact
            </h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Melbourne, Australia</p>
              <p>Email: support@loftyedu.com</p>
              <p>Mon - Sun: 9:00 AM - 9:00 PM</p>
            </div>
          </div>
        </div>

        {/* 底部版权 */}
        <div
          className="flex flex-col gap-3 border-t py-6 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between"
     
        >
          <p>© 2026 Lofty Education. All rights reserved.</p>
          <p>Built by Chi · SEO Optimized · Mobile First</p>
        </div>
      </Container>
    </footer>
  );
}