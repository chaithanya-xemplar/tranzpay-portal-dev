import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema,  } from "../../schemas/forgotPasswordSchema";
import type { ForgotPasswordFormData } from "../../schemas/forgotPasswordSchema";
import { SUPPORT_URL } from "../../constants/links";
import { AUTH_CONSTANTS } from "../../constants/constants";
import emailIcon from "../../assets/email-icon.svg";
import userIcon from "../../assets/user-icon.svg";
import Button from "../../design-system/Button";
import AuthLayout from "../../components/AuthLayout";

const ForgotPasswordPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    console.log("Forgot Password Data", data);
  };

  return (
    <AuthLayout>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-black">{AUTH_CONSTANTS.FORGOT_PASSWORD_TITLE}</h2>
          
          <Button
            variant="outline"
            icon="arrow-left"
            iconPosition="left"
            className="px-1"
            onClick={() => window.history.back()}
          >
            {AUTH_CONSTANTS.GO_BACK}
          </Button>
        </div>
        <p className="text-base mb-6">
          {AUTH_CONSTANTS.RESET_PASSWORD_MESSAGE}
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="block text-sm pb-1 text-light-grey">{AUTH_CONSTANTS.EMAIL}</label>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    {/* User Icon */}
                    <img src={emailIcon} alt="Email Icon" className="h-5 w-5" />
                </span>
                <input
                    {...register('email')}
                    placeholder={AUTH_CONSTANTS.ENTER_YOUR_EMAIL}
                    autoComplete="off"
                    className={`input-base pl-10 bg-divider2  ${errors.email ? 'border-error': 'focus:ring-1 focus:ring-light-grey'} `}
                />
            </div>
            {errors.email && (
              <p className="text-error text-sm mt-1">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm pb-1 text-light-grey">{AUTH_CONSTANTS.USERNAME}</label>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    {/* User Icon */}
                    <img src={userIcon} alt="User Icon" className="h-5 w-5" />
                </span>
                <input
                    {...register('username')}
                    placeholder={AUTH_CONSTANTS.ENTER_YOUR_USERNAME}
                    autoComplete="off"
                    className={`input-base pl-10 bg-divider2 ${errors.username ? 'border-error': 'focus:ring-1 focus:ring-light-grey'} `}
                />
            </div>
            {errors.username && (
              <p className="text-error text-sm mt-1">{errors.username.message}</p>
            )}
          </div>
          <div className="pb-6 pt-4 border-b border-dotted border-light-grey">
            <Button className="w-full py-2 h-12">
                {AUTH_CONSTANTS.SEND_RECOVERY_LINK.toUpperCase()}
            </Button>
          </div>
        </form>
        <div className="text-center text-base mt-4">
          {AUTH_CONSTANTS.NEED_HELP}
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary font-semibold hover:underline pl-1"
          >
            { AUTH_CONSTANTS.VISIT_SUPPORT}
          </a>
        </div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;