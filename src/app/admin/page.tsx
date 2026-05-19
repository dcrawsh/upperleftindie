import type { Metadata } from "next";
import SiteContainer from "../components/SiteContainer";
import AdminDashboard from "./AdminDashboard";

export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return (
    <section className="py-10 md:py-14">
      <SiteContainer>
        <AdminDashboard />
      </SiteContainer>
    </section>
  );
}
