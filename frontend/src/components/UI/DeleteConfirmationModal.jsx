import Modal from "react-modal";

Modal.setAppElement("#root");

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  plot,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="modal"
      overlayClassName="modal-overlay"
    >
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-red-600">
          Confirm Plot Deletion
        </h2>

        {plot && (
          <>
            <div className="mb-4">
              <p className="font-medium">Plot Number: {plot.plotNumber}</p>
              <p className="text-sm text-gray-600">
                Location: {plot.location?.name}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {plot.users?.length || 0} users will be unassigned
              </p>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    This action will unassign all users but preserve them in the
                    system.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
