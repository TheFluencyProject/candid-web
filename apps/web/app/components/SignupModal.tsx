import { useState } from "react";

interface SignupModalProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}

export default function SignupModal({
  showModal,
  setShowModal,
}: SignupModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    email: "",
    learningLanguage: "",
    proficiencyLevel: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const proficiencyLevels = [
    "Beginner",
    "Early Intermediate",
    "Intermediate",
    "Upper Intermediate",
    "Advanced",
  ];

  const languages = [
    "Korean",
    "Spanish",
    "French",
    "German",
    "Italian",
    "Portuguese",
    "Russian",
    "Japanese",
    "Chinese (Mandarin)",
    "Arabic",
  ];

  const isFormValid =
    formData.firstName.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.learningLanguage.trim() !== "" &&
    formData.proficiencyLevel.trim() !== "";

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Send directly to Zapier webhook using FormData to avoid CORS issues
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.firstName);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("learningLanguage", formData.learningLanguage);
      formDataToSend.append("proficiencyLevel", formData.proficiencyLevel);
      formDataToSend.append("timestamp", new Date().toISOString());

      const response = await fetch(
        "https://hooks.zapier.com/hooks/catch/23297835/uyh4gu0/",
        {
          method: "POST",
          body: formDataToSend,
        }
      );

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setShowModal(false);
          setSubmitted(false);
          setFormData({
            firstName: "",
            email: "",
            learningLanguage: "",
            proficiencyLevel: "",
          });
        }, 2000);
      } else {
        throw new Error("Failed to submit form");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(
        "There was an error submitting your information. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showModal) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={() => setShowModal(false)}
    >
      <div
        className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>

        {!submitted ? (
          <>
            <h2
              className="text-2xl font-bold mb-6 text-center text-gray-800"
              style={{ fontFamily: "var(--font-sf-pixelate)" }}
            >
              Join the waitlist
            </h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 bg-gray-100 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 bg-gray-100 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="learningLanguage"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  What language are you learning?
                </label>
                <select
                  id="learningLanguage"
                  value={formData.learningLanguage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      learningLanguage: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 bg-gray-100 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select your language</option>
                  {languages.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="proficiencyLevel"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  How well do you speak that language?
                </label>
                <select
                  id="proficiencyLevel"
                  value={formData.proficiencyLevel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      proficiencyLevel: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 bg-gray-100 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select your level</option>
                  {proficiencyLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="w-full bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Join waitlist"}
              </button>
            </form>
          </>
        ) : (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-4 max-w-2xl w-full relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl z-10"
              >
                ×
              </button>
              <iframe
                src="https://thefluencyproject.notion.site/228bc1de5e34801daa60c0efb4687a13?pvs=105"
                width="100%"
                height="600"
                frameBorder="0"
                allowFullScreen
                className="rounded w-full"
                title="Notion Waitlist Form"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
