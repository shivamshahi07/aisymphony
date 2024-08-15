import ImageForm from '@/components/imageform';

const GenerateImagePage = () => {
  return (
    <div className='w-full flex flex-col justify-center min-h-screen mt-20 p-2 ml-5 '>
        <h1 className='mb-3 text-4xl font-bold'>Generate an Image 🎨</h1>
        <h3 className='mb-12 text-lg font-semibold '>Create stunning images with open source AI models.</h3>
      <ImageForm />
    </div>
  );
};

export default GenerateImagePage;