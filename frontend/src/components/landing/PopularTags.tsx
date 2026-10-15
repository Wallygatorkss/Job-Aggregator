export const PopularTags = () => {
  const tags = ['Développeur', 'Data Analyst', 'Product Manager', 'DevOps', 'IA / Machine Learning'];

  return (
    <div className="flex items-center gap-3 flex-wrap mt-6">
      <span className="text-gray-400 text-sm">Recherches populaires :</span>
      {tags.map((tag) => (
        <button
          key={tag}
          className="px-4 py-1.5 rounded-full border border-[#333] text-gray-300 text-sm hover:border-[#d4a574] hover:text-[#d4a574] transition-colors"
        >
          {tag}
        </button>
      ))}
    </div>
  );
};
