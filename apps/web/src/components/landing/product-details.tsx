import { Reveal } from "@/components/reveal";
import { productCapabilities, productFaq } from "@/lib/product-content";

const integrationSteps = [
  [
    "Install & connect",
    "Add pagiera to your application. Configure PostgreSQL, Redis and protected editor/API routes. Add an OpenRouter key only if you want to use AI generation.",
  ],
  [
    "Design & refine",
    "Start with native elements or a template. Reuse components and layouts, adjust breakpoints, and review targeted AI proposals before applying them.",
  ],
  [
    "Preview & publish",
    "Save a draft and test its preview. Publish the approved page through Pagiera, then serve it with the runtime. Deploy your application on your own infrastructure.",
  ],
] as const;

export function ProductDetails() {
  return (
    <>
      <section
        className="product-story"
        aria-labelledby="capabilities-title"
        id="capabilities"
      >
        <div className="product-story-heading">
          <Reveal as="p" className="product-eyebrow" distance={18}>
            A closer look at Pagiera
          </Reveal>
          <Reveal as="h2" delay={0.08} id="capabilities-title">
            More than a canvas.
            <br />
            <span>A system for your site.</span>
          </Reveal>
          <Reveal as="p" delay={0.16} distance={20}>
            From reusable page structure to the smallest interaction, create
            native elements that remain editable after the first design.
          </Reveal>
        </div>
        <div className="product-capabilities">
          {productCapabilities.map((item, index) => (
            <Reveal as="article" delay={(index % 2) * 0.1} key={item.category}>
              <p className="product-eyebrow">{item.category}</p>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <ul>
                {item.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </section>
      <section
        className="integration-story"
        id="integration"
        aria-labelledby="integration-title"
      >
        <div>
          <Reveal as="p" className="product-eyebrow" distance={18}>
            For developers and coding agents
          </Reveal>
          <Reveal as="h2" delay={0.08} id="integration-title">
            Your next website.
            <br />
            Inside your own stack.
          </Reveal>
          <Reveal as="p" delay={0.16} distance={20}>
            Pagiera is an MIT-licensed React and Next.js website builder, not a
            separate hosted website account. Install the package, connect your
            services and keep your design in an editable document.
          </Reveal>
          <Reveal as="div" delay={0.22} distance={16}>
            <a href="/docs">Read the integration guide →</a>
            <a href="/docs/agents">Build with your coding agent →</a>
          </Reveal>
        </div>
        <ol>
          {integrationSteps.map(([title, text], index) => (
            <Reveal as="li" delay={index * 0.09} key={title}>
              <span>0{index + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>
      <section className="product-faq" id="faq" aria-labelledby="faq-title">
        <div>
          <Reveal as="p" className="product-eyebrow" distance={18}>
            Before you build
          </Reveal>
          <Reveal as="h2" delay={0.08} id="faq-title">
            Good questions.
            <br />
            Straight answers.
          </Reveal>
          <Reveal as="p" delay={0.16} distance={20}>
            The setup, the workflow and what you own.
          </Reveal>
        </div>
        <div>
          {productFaq.map((item, index) => (
            <Reveal
              as="details"
              amount={0.6}
              delay={index * 0.05}
              distance={16}
              key={item.question}
            >
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
