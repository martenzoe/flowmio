export default function Kapitel1() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Executive Summary</h1>
      <p className="text-gray-600 mb-6">Bitte gib hier die wichtigsten Eckpunkte deiner Geschäftsidee ein.</p>

      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ziel</label>
          <textarea className="w-full p-3 border rounded-xl" rows="3" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Idee</label>
          <textarea className="w-full p-3 border rounded-xl" rows="3" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">USP</label>
          <textarea className="w-full p-3 border rounded-xl" rows="3" />
        </div>

        <div className="text-right">
          <button
            type="button"
            className="bg-[#84C7AE] text-white px-6 py-2 rounded-xl hover:bg-[#6db49b]"
          >
            Weiter
          </button>
        </div>
      </form>
    </div>
  );
}
