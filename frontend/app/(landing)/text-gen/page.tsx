import Textform from "@/components/textform";

const GenerateTextPage = () => {
  return (
    <div className="w-full flex flex-col justify-center min-h-screen mt-10 p-2 ml-5 ">
      <h1 className="mb-10 text-4xl font-bold">Chat with AI 📝</h1>
      <h3 className="mb-10 text-lg font-semibold ">
        Let your imagination run wild with this powerful tool 🌏
      </h3>
      <Textform />
    </div>
  );
};

export default GenerateTextPage;
