import ProfileSettingsClient from "@/components/profile/ProfileSettingsClient";

export const metadata = {
  title: "Cài đặt tài khoản | TicketRush",
  description: "Quản lý thông tin cá nhân của bạn trên TicketRush",
};

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 md:px-8 max-w-4xl py-8">
      <ProfileSettingsClient />
    </div>
  );
}
