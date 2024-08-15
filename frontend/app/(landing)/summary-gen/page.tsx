import Summaryform from "@/components/summaryform";

const GenerateImagePage = () => {
  return (
    <div className="w-full flex flex-col justify-center mt-20 p-2 ml-5 ">
      <h1 className="mb-3 text-4xl font-bold">Summarize Text</h1>
      <h3 className="mb-12 text-lg font-semibold ">let your imagination run wild with this powerful tool </h3>
      <Summaryform />
    </div>
  );
};

export default GenerateImagePage;
