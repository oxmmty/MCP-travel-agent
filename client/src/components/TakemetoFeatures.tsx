import { motion } from "framer-motion";
import { User, Zap, Eye } from "lucide-react";

export default function TakemetoFeatures() {
  const features = [
    {
      icon: User,
      title: "Smart Personalization",
      description: "Our AI analyzes your travel personality to recommend spots perfectly tailored to your preferences and style.",
      gradient: "from-coral-primary to-purple-mid"
    },
    {
      icon: Zap,
      title: "Instant Itineraries", 
      description: "Get complete travel plans in seconds, from flight to hotel gems that match your budget and travel style.",
      gradient: "from-purple-mid to-blue-end"
    },
    {
      icon: Eye,
      title: "Local Insights",
      description: "Access insider knowledge and authentic experiences that help build local communities and authentic stories.",
      gradient: "from-blue-end to-coral-primary"
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-medium text-foreground mb-4">
            Why Choose <span className="text-gradient">takemeto</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-powered travel planning that learns your preferences
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              {/* Icon */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={`w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r ${feature.gradient} flex items-center justify-center group-hover:shadow-lg transition-shadow duration-300`}
              >
                <feature.icon className="w-8 h-8 text-white" />
              </motion.div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-foreground mb-4">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}