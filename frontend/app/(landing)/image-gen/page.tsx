import ImageForm from '@/components/imageform';

const GenerateImagePage = () => {
  return (
    <div className='min-h-screen pt-16 pb-8 px-4 md:px-6 lg:px-8 flex flex-col'>
      <div className='max-w-7xl mx-auto flex-1 flex flex-col  '>
        {/* Header Section */}
        <div className='text-center mb-8'>
          <h1 className='text-4xl md:text-5xl font-bold mb-4'>
            Generate an Image 🎨
          </h1>
          <h3 className='text-lg md:text-xl font-semibold text-gray-600 max-w-3xl mx-auto'>
            Create stunning images with open source AI models 🧑‍🎨
          </h3>
        </div>
        
        {/* Form Component - Takes remaining space */}
        <div className='flex-1'>
          <ImageForm />
        </div>
      </div>
    </div>
  );
};

export default GenerateImagePage;