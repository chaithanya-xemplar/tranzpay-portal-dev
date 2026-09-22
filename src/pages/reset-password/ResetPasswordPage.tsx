import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SUPPORT_URL } from "../../constants/links";
import { AUTH_CONSTANTS } from "../../constants/constants";
import Button from "../../design-system/Button";
import passwordIcon from "../../assets/password-icon.svg";
import { resetPasswordSchema } from "../../schemas/resetPasswordSchema";
import type { ResetPasswordFormData } from "../../schemas/resetPasswordSchema";
import AuthLayout from "../../components/AuthLayout";


const ResetPasswordPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema)
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    console.log("Reset Password Data", data);
    // Handle reset logic here
  };

  return (
    <AuthLayout>
        <h2 className="text-2xl font-bold mb-6 text-black">{AUTH_CONSTANTS.RESET_PASSWORD}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="pb-3">
            <label className="block text-sm pb-1 text-light-grey">{AUTH_CONSTANTS.NEW_PASSWORD}</label>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <img src={passwordIcon} alt="Password Icon" className="h-5 w-5" />
                </span>
                <input
                type="password"
                {...register('newPassword')}
                placeholder={AUTH_CONSTANTS.ENTER_NEW_PASSWORD}
                autoComplete="off"
                className={`input-base pl-10 bg-divider2 ${errors.newPassword ? 'border-error': 'focus:ring-1 focus:ring-light-grey'} `}
                />
            </div>
            {errors.newPassword && (
                <p className="text-error text-sm mt-1">{errors.newPassword.message}</p>
            )}
            </div>
            <div>
            <label className="block text-sm pb-1 text-light-grey">{AUTH_CONSTANTS.CONFIRM_PASSWORD}</label>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <img src={passwordIcon} alt="Password Icon" className="h-5 w-5" />
                </span>
                <input
                type="password"
                {...register('confirmPassword')}
                placeholder={AUTH_CONSTANTS.RE_ENTER_NEW_PASSWORD}
                autoComplete="off"
                className={`input-base pl-10 bg-divider2 ${errors.confirmPassword ? 'border-error': 'focus:ring-1 focus:ring-light-grey'} `}
                />
            </div>
            {errors.confirmPassword && (
                <p className="text-error text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
            </div>
            <div className="pb-6 pt-4 border-b border-dotted border-light-grey">
            <Button className="w-full py-2 h-12" type="submit">
                {AUTH_CONSTANTS.SUBMIT.toUpperCase()}
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
            {AUTH_CONSTANTS.VISIT_SUPPORT}
            </a>
        </div>
    </AuthLayout>
  );
};

export default ResetPasswordPage;