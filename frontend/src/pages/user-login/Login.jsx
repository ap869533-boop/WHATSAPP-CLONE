import React, { useState } from 'react'
import userLoginStore from '../../store/useLoginStore'
import userUserStore from '../../store/useUserStore'
import countries from '../../utills/countries'
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { set, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import userThemeStore from '../../store/themeStore';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaChevronDown, FaPlus, FaUser, FaWhatsapp } from 'react-icons/fa';
import Spinner from '../../utills/spinner.jsx';
import { toast } from 'react-toastify';
import { sendOtp, verifyOtp, updateUserProfile } from "../../services/user.service.js"



// validation schema 
const loginValidationSchema = yup.object().shape({
  phoneNumber: yup.string().nullable().notRequired()
    .matches(/^\d{10}$/, "Phone number must be exactly 10 digits").transform((value, originalValue) =>
      originalValue.trim() === "" ? null : value
    ),

  email: yup.string().nullable().notRequired()
    .email("Invalid email format").transform((value, originalValue) =>
      originalValue.trim() === "" ? null : value
    )
}).test(
  "at-least-one",
  "Either phone number or email is required",
  function (value) {
    return !!(value?.phoneNumber || value?.email)
  }
)


const otpValidationSchema = yup.object().shape({
  otp: yup.string().required("OTP is required")
    .length(6, "OTP must be exactly 6 digits")
})

const profileValidationSchema = yup.object().shape({
  username: yup.string().required("Username is required"),
  agreed: yup.boolean().oneOf([true], "You must agree to the terms and conditions")
})

const avatars = [
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Mimi',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Jasper',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Luna',
  'https://api.dicebear.com/6.x/avataaars/svg?seed=Zoe',
]



const Login = () => {
  const { step, setStep, setUserPhoneData, userPhoneData, resetLoginStore } = userLoginStore();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser } = userUserStore();
  const { theme, setTheme } = userThemeStore();
  const [loading, setLoading] = useState(false);


  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm({
    resolver: yupResolver(loginValidationSchema)
  })

  const {
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
    setValue: setOtpValue
  } = useForm({
    resolver: yupResolver(otpValidationSchema)
  })


  const {
    register: profileRegister,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    watch
  } = useForm({
    resolver: yupResolver(profileValidationSchema)
  })


  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(searchTerm.toLocaleLowerCase()) ||
    country.dialCode.includes(searchTerm)
  );

  const onLoginSubmit = async () => {
    try {
      setLoading(true);
      if (email) {
        const response = await sendOtp(null, null, email);
        if (response.status === 'success') {
          toast.info("OTP sent to your email")
          setUserPhoneData({ email });
          setStep(2);
        }
      } else {
        const response = await sendOtp(phoneNumber, selectedCountry.dialCode);
        if (response.status === 'success') {
          toast.info("OTP sent to your phone number")
          setUserPhoneData({ phoneNumber, phoneSuffix: selectedCountry.dialCode });
          setStep(2);
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "An error occurred while sending OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }


  const onOtpSubmit = async () => {
    try {
      setLoading(true);
      if (!userPhoneData) {
        throw new Error("No phone number or email found. Please go back and enter your details.");
      };
      const otpString = otp.join("");
      let response;
      if (userPhoneData?.email) {
        response = await verifyOtp(null, null, otpString, userPhoneData.email);
      } else {
        response = await verifyOtp(userPhoneData.phoneNumber, userPhoneData.phoneSuffix, otpString, null);
      }

      if (response.status === 'success') {
        toast.success("OTP verified successfully")
        const user = response.data?.user;
        if (user?.username && user?.profilePicture) {
          setUser(user);
          toast.success("Welcome back to WhatsApp");
          navigate("/")
          resetLoginStore();
        } else {
          setStep(3);
        }
      }

    } catch (error) {
      console.error("OTP submit error:", error);
      setError(error.message || "An error occurred while submitting OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);
      setProfilePicture(URL.createObjectURL(file));
    }
  }



  const onProfileSubmit = async (data) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("username", data.username);
      formData.append("agreed", data.agreed);
      if (profilePictureFile) {
        formData.append("media", profilePictureFile);
      } else {
        formData.append("profilePicture", selectedAvatar);
      }

      await updateUserProfile(formData);
      toast.success("welcome back to Whatsapp");
      navigate("/");
      resetLoginStore();
    } catch (error) {
      console.error("Profile submit error:", error);
      setError(error.message || "failed update User profile.");
    } finally {
      setLoading(false);
    }
  }



  const handleOtpChange = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpValue("otp", newOtp.join(""));
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  }

  const ProgressBar = () => (
    <div className={`w-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"} h-2.5 rounded-full mb-6 `}>
      <div className="bg-green-500 h-2 rounded-full transition-all duration-500 ease-in-out"
        style={{ width: `${(step / 3) * 100}%` }}></div>
    </div>

  )

  const handleBack = () => {
    setStep(1);
    setUserPhoneData(null);
    setOtp(["", "", "", "", "", ""]);
    setError("");
  }



  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gradient-to-br from-green-400 to-blue-500"} flex items-center justify-center p-4 overflow-hidden`}>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white"} p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-md relative z-10 `}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
          className='w-24 h-24 p-4 bg-green-500 rounded-full mx-auto mb-6 flex item-center justify-center'
        >
          <FaWhatsapp className='w-16 h-16 text-white flex item-center justify-center' />
        </motion.div>

        <h1 className={`text-3xl font-bold text-center mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>WhatsApp Login</h1>
        <ProgressBar />
        {error && <p className='text-red-500 text-center mb-4'>{error}</p>}

        {step === 1 && (
          <form
            className="space-y-4"
            onSubmit={handleLoginSubmit(onLoginSubmit)}
          >
            <p className={`text-center mb-4 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
              Enter your phone number to recevie an OTP
            </p>

            <div className='relative'>
              <div className='flex'>
                <div className='relative w-1/3'>
                  {/* <button
                    type='button'
                    className={`flex-shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center 
                      ${theme === "dark" ? "text-white bg-gray-700 border-gray-600 " : "text-gray-900 bg-gray-100 border-gray-300"} 
                      border rounded-s-lg hover:bg-gray-200 focus:right-4 focus:outline-none focus:ring-gray-100`}>
                    <span>{selectedCountry.flag} {selectedCountry.dialCode}{<FaChevronDown className='ml-2'/>}</span>
                  </button> */}
                  <button
                    type="button"
                    className={`flex items-center py-2.5 px-4 text-sm font-medium 
                         ${theme === "dark"
                        ? "text-white bg-gray-700 border-gray-600"
                        : "text-gray-900 bg-gray-100 border-gray-300"} 
                         border rounded-s-lg hover:bg-gray-200 focus:outline-none`}
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    {selectedCountry.flag} {selectedCountry.dialCode}
                    <FaChevronDown className="ml-2" />
                  </button>
                  {showDropdown && (
                    <div className={`absolute z-10 w-full mt-1 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}
                   border rounded-md shadow-lg max-h-60 overflow-auto`}>
                      <div className={`sticky top-0 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} p-2`}>
                        <input
                          type="text"
                          placeholder='search country'
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={`w-full px-2 py-1 border ${theme === 'dark' ? 'border-gray-600 bg-gray-500 text-white' : "bg-white border-gray-300"}
                           rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500`}
                        />
                      </div>
                      {filteredCountries.map((country) => (
                        <button
                          key={country.alpha2}
                          type='button'
                          className={`w-full text-left px-3 py-2 ${theme === "dark" ? "hover:bg-gray-600 " : " hover:bg-gray-100 "} focus:outline-none focus:bg-gray-100 `}
                          onClick={() => {
                            setSelectedCountry(country)
                            setShowDropdown(false)
                          }}

                        >
                          {country.flag} ({country.dialCode}) {country.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  {...loginRegister("phoneNumber")}
                  placeholder='Phone number'
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={`w-2/3 ${theme === "dark" ? "bg-gray-700 text-white border-gray-600" : "bg-white border-gray-300"} 
                   border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${loginErrors.phoneNumber ? "border-red-500" : ""}`}
                />
              </div>
              {loginErrors.phoneNumber && <p className='text-red-500 text-sm mt-1'>{loginErrors.phoneNumber.message}</p>}
            </div>
            {/* diverder with or */}
            <div className='flex items-center my-4'>
              <div className='flex-grow h-px bg-gray-300 ' />
              <span className='mx-3 text-gray-500 text-sm font-medium'>or</span>
              <div className='flex-grow h-px bg-gray-300' />
            </div>

            {/* Email input field  */}

            <div
              className={`flex item-center border rounded-md px-3 py-2  ${theme === "dark" ? "bg-gray-700 border-gray-600"
                : "bg-white border-gray-300"} `}
            >
              <FaUser className={`mr-2 text-gray-400 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} />
              <input
                type="email"
                {...loginRegister("email")}
                value={email}
                placeholder='Email (optional)'
                onChange={(e) => setEmail(e.target.value)}
                className={`w-w-full bg-transparent focuc:outline-none ${theme === "dark" ? "text-white " : " text-black "} 
                  ${loginErrors.email ? "border-red-500" : ""}`}
              />
              {loginErrors.email && <p className='text-red-500 text-sm mt-1'>{loginErrors.email.message}</p>}
            </div>
            <button
              type='submit'
              className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition"
            >
              {loading ? <Spinner /> : "Send OTP"}
            </button>
          </form>
        )}
        {step === 2 && (
          <form
            className="space-y-4"
            onSubmit={handleOtpSubmit(onOtpSubmit)}
          >
            <p className={`text-center mb-4 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
              Please enter the 6-digit OTP sent to your {userPhoneData?.phoneSuffix || "Email"}
              {""} {userPhoneData?.phoneNumber && userPhoneData.phoneNumber}
            </p>
            <div className='flex justify-between'>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  id={`otp-${index}`}
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  className={`w-12 h-12 text-center border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 
                    ${theme === "dark" ? "bg-gray-700 text-white border-gray-600" : "bg-white border-gray-300"} ${otpErrors.otp ? "border-red-500" : ""}`}
                />
              ))}
            </div>
            {otpErrors.otp && <p className='text-red-500 text-sm mt-1'>{otpErrors.otp.message}</p>}
            <button
              type='submit'
              className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition"
            >
              {loading ? <Spinner /> : "Verify OTP"}
            </button>
            <button
              type='button'
              onClick={handleBack}
              className={`w-full mt-2 flex items-center justify-center py-2 rounded-md hover:bg-gray-300 ${theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700 "} transition`}
            >
              <FaArrowLeft className='mr-2' onClick={handleBack} />
              Wrong Number ? Go Back
            </button>
          </form>
        )}
        {step === 3 && (
          <form className='space-y-4' onSubmit={handleProfileSubmit(onProfileSubmit)}>
            <div className='flex flex-col items-center mb-4'>
              <div className='relative w-24 h-24 mb-2'>
                <img
                  src={profilePicture || selectedAvatar}
                  alt="profile"
                  className='w-full h-full rounded-full object-cover'
                />
                <label
                  htmlFor='profile-picture'
                  className="absolute bottom-0 right-0 bg-green-500 text-white p-2 rounded-full cursor-pointer hover:bg-green-600 transition"
                >
                  <FaPlus className='w-4 h-4' />
                </label>
                <input
                  type='file'
                  id='profile-picture'
                  accept='image/*'
                  onChange={handleFileChange}
                  className='hidden'
                />
              </div>
              <p className={`text-sm mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                Choose an avatar
              </p>
              <div className='flex flex-wrap justify-center gap-2'>
                {avatars.map((avatar, index) => (
                  <img
                    key={index}
                    src={avatar}
                    alt={`avatar-${index}`}
                    className={`w-12 h-12 rounded-full  cursor-pointer transition duration-300 ease-in-out transform hover:scale-110 ${selectedAvatar === avatar ? " ring-2 ring-green-500" : ""} `}
                    onClick={() => {
                      setSelectedAvatar(avatar);
                    }}
                  />
                ))}

              </div>
            </div>
            <div className='relative'>
              <FaUser
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
              />
              <input
                type="text"
                {...profileRegister("username")}
                placeholder='Username'
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-lg 
                      ${theme === "dark" ? "bg-gray-700 text-white border-gray-600" : "bg-white border-gray-300"} `}
              />
              {profileErrors.username && <p className='text-red-500 text-sm mt-1'>{profileErrors.username.message}</p>}
            </div>
            <div className='flex item-center space-x-2'>
              <input
                type="checkbox"
                {...profileRegister("agreed")}
                className={`rounded ${theme === "dark" ? "text-green-500 bg-gray-700" : "text-green-700"} focus:ring-green-500`}
              />
              <label
                htmlFor='terms'
                className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                I agree to the {""}
                <a href='#' className="text-red-500 hover:underline">terms and conditions</a>
              </label>
            </div>
             {profileErrors.agreed && <p className='text-red-500 text-sm mt-1'>{profileErrors.agreed.message}</p>}
              <button
                type='submit'
                disabled={!watch("agreed")}
                className={`w-full bg-green-500 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out tranform hover:scale-105 flex items-center justify-center text-lg
                        ${loading ? "opacity-50 cursor-not-allowed " : ""}`}
              >
                {loading ? <Spinner /> : "Create Profile"}
              </button>
          </form>
        )}

      </motion.div>
    </div>
  )
}

export default Login