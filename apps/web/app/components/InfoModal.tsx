interface InfoModalProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}

export default function InfoModal({ showModal, setShowModal }: InfoModalProps) {
  if (!showModal) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={() => setShowModal(false)}
    >
      <div
        className="bg-white rounded-lg pt-8 px-8 pb-6 max-w-lg w-full mx-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>

        <div className="text-left">
          <div className="text-gray-700">
            <p className="mb-4">
              Meet your Amiko—a bilingual best friend. 
            </p>

            <p className="mb-4">
              They speak both the language you already know & the one you're trying to learn. They live a local life in the
              country & love sharing their culture. And they genuinely want to see you fluent.
            </p>

            <p className="mb-4">
              No more flashcards. Enough grammar drills. Just natural conversations that feel more like immersion than a classroom.
            </p>

            <p>
              Stop studying the language and start living it.
            </p>

            <div className="mt-8 pt-4 border-t border-gray-200">
              <div className="flex justify-start space-x-4 text-sm text-gray-500">
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-700"
                >
                  Privacy
                </a>
                <span className="text-gray-200">|</span>
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-700"
                >
                  Terms
                </a>
                <span className="text-gray-200">|</span>
                <a
                  href="mailto:support@thefluencyproject.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-700"
                >
                  Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
