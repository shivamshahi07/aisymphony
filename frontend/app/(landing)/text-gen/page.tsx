import Textform from "@/components/textform";

const GenerateImagePage = () => {
  return (
    <div className="w-full flex flex-col justify-center min-h-screen -mt-10 p-2 ml-5 ">
      <h1 className="mb-3 text-4xl font-bold">Generate Text </h1>
      <h3 className="mb-12 text-lg font-semibold ">
        let your imagination run wild with this powerful tool{" "}
      </h3>
      <Textform />
    </div>
  );
};

export default GenerateImagePage;
