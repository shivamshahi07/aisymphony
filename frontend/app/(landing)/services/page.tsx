import ServiceCard from "./servicecard";

export default function Services() {
  return (
    <div className="container mx-auto px-4 mt-20 ">
      <h2 className="text-2xl font-bold mb-6 text-center">
        List of services we offer:
      </h2>
      <ServiceCard />
    </div>
  );
}
