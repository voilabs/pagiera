import { docsCategories } from "@/lib/docs-navigation";
import { localizedHref } from "@/lib/urls";

export function DocumentationCategories({ locale }: { locale: "en" | "tr" }) {
  return (
    <div className="docs-category-grid not-prose">
      {docsCategories(locale).map((category, index) => (
        <section
          key={category.title}
          aria-labelledby={`docs-category-${index}`}
        >
          <h3 id={`docs-category-${index}`}>
            {category.title}
            <span>{category.pages.length}</span>
          </h3>
          <ul>
            {category.pages.map((page) => (
              <li key={page.slug}>
                <a href={localizedHref(`/docs/${page.slug}`, locale)}>
                  <strong>{page.title}</strong>
                  <span>{page.description}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
