// import ContactInformationForm from "../../components/profile/ContactInformationForm";
import PersonalDetailsCard from "./PersonalDetailsCard";

const ProfilePage = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        
      {/* PersonalDetailsCard Section */}
      <div className="lg:col-span-1">
        <PersonalDetailsCard />
      </div>

      {/* ContactInformationForm Section */}
      <div className="lg:col-span-1">
        {/* <ContactInformationForm /> */}
      </div>

      {/* Return & Refund Policy Section (optional - later) */}
      <div className="lg:col-span-2">
        {/* Return & Refund Policy (next step) */}
      </div>
    </div>
  );
};

export default ProfilePage;