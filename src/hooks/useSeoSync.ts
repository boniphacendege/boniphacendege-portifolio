import { useEffect } from 'react';
import { ProfileData, ProjectItem, ProjectPageMeta } from '../data/portfolioStorage';

export function useSeoSync(profile: ProfileData, activeProject?: ProjectItem | null) {
  useEffect(() => {
    // Helper to update or create meta tag
    const setMetaTag = (attribute: 'name' | 'property', key: string, value: string) => {
      let tag = document.querySelector(`meta[${attribute}="${key}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, key);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', value);
      return tag;
    };

    // Helper to update or create canonical link tag
    const setCanonicalTag = (url: string) => {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', url);
    };

    // Clean up any previously injected project-specific custom tags
    const removeCustomProjectTags = () => {
      document.querySelectorAll('meta[data-project-custom="true"]').forEach((el) => el.remove());
    };

    removeCustomProjectTags();

    const professionalName = 'Boniphace Ndege';
    const formalTitleName = 'Ev Dr. Boniphace J. Ndege';
    const siteName = 'Boniphace Ndege';
    const canonicalDomain = 'https://boniphacendege.com';

    const titlesString = profile.titles?.length
      ? profile.titles.join(' · ')
      : 'Graphic Designer · Website Designer & Developer · Digital Content Creator';

    const baseTitle = `${professionalName} | ${titlesString}`;
    const baseDescription = `Official portfolio of ${professionalName} (${formalTitleName}) — Graphic Designer, Website Designer & Developer, and Digital Content Creator based in Dodoma CBD, Tanzania. Explore visual branding, modern responsive websites, and digital media.`;
    const baseKeywords = `${professionalName}, ${formalTitleName}, Boniphace, ${siteName}, ${profile.titles?.join(', ')}, Graphic Designer, Website Designer, Web Developer, Digital Content Creator, Dodoma CBD Tanzania, Visual Branding, AI Workflows`;
    const defaultShareImage = `${canonicalDomain}/pwa-512x512.png`;

    if (activeProject) {
      // -------------------------------------------------------------
      // PROJECT MODAL OPEN: Inject project-specific custom meta tags
      // -------------------------------------------------------------
      const projectMeta: ProjectPageMeta =
        (profile.projectMetaTags && (profile.projectMetaTags[activeProject.id] || profile.projectMetaTags[activeProject.slug])) || {};

      const projectTitle = projectMeta.title || `${activeProject.title} | ${professionalName}`;
      const projectDescription = projectMeta.description || activeProject.summary || activeProject.fullDescription || baseDescription;
      const projectKeywords = projectMeta.keywords || `${activeProject.title}, ${activeProject.category}, ${activeProject.tools?.join(', ')}, ${professionalName}, Case Study`;
      const projectOgImage = projectMeta.ogImage || activeProject.thumbnail || defaultShareImage;
      const projectOgTitle = projectMeta.ogTitle || projectTitle;
      const projectOgDescription = projectMeta.ogDescription || projectDescription;
      const projectOgType = projectMeta.ogType || 'article';
      const projectCanonicalUrl = `${canonicalDomain}/#project-${activeProject.id}`;

      const projectTwitterTitle = projectMeta.twitterTitle || projectOgTitle;
      const projectTwitterDesc = projectMeta.twitterDescription || projectOgDescription;
      const projectTwitterImage = projectMeta.twitterImage || projectOgImage;

      // Update Title & Core Search Tags
      document.title = projectTitle;
      setCanonicalTag(projectCanonicalUrl);
      setMetaTag('name', 'description', projectDescription);
      setMetaTag('name', 'author', professionalName);
      setMetaTag('name', 'keywords', projectKeywords);

      // OpenGraph Tags
      setMetaTag('property', 'og:site_name', siteName);
      setMetaTag('property', 'og:title', projectOgTitle);
      setMetaTag('property', 'og:description', projectOgDescription);
      setMetaTag('property', 'og:image', projectOgImage);
      setMetaTag('property', 'og:type', projectOgType);
      setMetaTag('property', 'og:url', projectCanonicalUrl);
      setMetaTag('property', 'og:locale', 'en_US');

      // Twitter / X Tags
      setMetaTag('name', 'twitter:title', projectTwitterTitle);
      setMetaTag('name', 'twitter:description', projectTwitterDesc);
      setMetaTag('name', 'twitter:image', projectTwitterImage);
      setMetaTag('name', 'twitter:card', 'summary_large_image');
      setMetaTag('name', 'twitter:site', '@boniphacendege');
      setMetaTag('name', 'twitter:creator', '@boniphacendege');

      // Inject any arbitrary custom tags declared in profile.projectMetaTags
      if (Array.isArray(projectMeta.customTags)) {
        projectMeta.customTags.forEach((customTag) => {
          if (!customTag.content) return;
          const attr = customTag.name ? 'name' : 'property';
          const key = customTag.name || customTag.property;
          if (!key) return;

          let tag = document.querySelector(`meta[${attr}="${key}"]`);
          if (!tag) {
            tag = document.createElement('meta');
            tag.setAttribute(attr, key);
            tag.setAttribute('data-project-custom', 'true');
            document.head.appendChild(tag);
          }
          tag.setAttribute('content', customTag.content);
        });
      }

      // Schema.org CreativeWork JSON-LD
      try {
        const existingScript = document.querySelector('script[type="application/ld+json"]');
        const projectStructuredData = {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebSite',
              '@id': `${canonicalDomain}/#website`,
              url: `${canonicalDomain}/`,
              name: siteName,
              description: baseDescription,
              inLanguage: 'en-US',
              publisher: {
                '@id': `${canonicalDomain}/#person`
              }
            },
            {
              '@type': 'Person',
              '@id': `${canonicalDomain}/#person`,
              name: professionalName,
              alternateName: ['Boniphace Ndege', 'Dr. Boniphace J. Ndege'],
              jobTitle: titlesString,
              url: `${canonicalDomain}/`,
              image: defaultShareImage,
              sameAs: [
                'https://github.com/boniphacendege',
                'https://linkedin.com/in/boniphace-ndege',
                'https://behance.net/boniphacendege',
                'https://dribbble.com/boniphacendege',
                'https://instagram.com/boniphace.designs',
                'https://facebook.com/boniphacendege',
                'https://x.com/boniphacendege'
              ]
            },
            {
              '@type': 'CreativeWork',
              '@id': `${projectCanonicalUrl}`,
              name: activeProject.title,
              headline: projectTitle,
              description: projectDescription,
              image: projectOgImage,
              genre: activeProject.category,
              keywords: projectKeywords,
              url: projectCanonicalUrl,
              author: {
                '@id': `${canonicalDomain}/#person`
              },
              creator: {
                '@id': `${canonicalDomain}/#person`
              }
            }
          ]
        };

        if (existingScript) {
          existingScript.textContent = JSON.stringify(projectStructuredData, null, 2);
        }
      } catch (e) {
        console.warn('Could not update project JSON-LD script', e);
      }
    } else {
      // -------------------------------------------------------------
      // PROJECT MODAL CLOSED: Restore Base Profile Portfolio SEO
      // -------------------------------------------------------------
      document.title = baseTitle;
      setCanonicalTag(`${canonicalDomain}/`);

      setMetaTag('name', 'description', baseDescription);
      setMetaTag('name', 'author', professionalName);
      setMetaTag('name', 'keywords', baseKeywords);

      // OpenGraph
      setMetaTag('property', 'og:site_name', siteName);
      setMetaTag('property', 'og:title', baseTitle);
      setMetaTag('property', 'og:description', baseDescription);
      setMetaTag('property', 'og:type', 'website');
      setMetaTag('property', 'og:url', `${canonicalDomain}/`);
      setMetaTag('property', 'og:locale', 'en_US');
      setMetaTag('property', 'og:image', defaultShareImage);

      // Twitter / X
      setMetaTag('name', 'twitter:title', baseTitle);
      setMetaTag('name', 'twitter:description', baseDescription);
      setMetaTag('name', 'twitter:card', 'summary_large_image');
      setMetaTag('name', 'twitter:site', '@boniphacendege');
      setMetaTag('name', 'twitter:creator', '@boniphacendege');
      setMetaTag('name', 'twitter:image', defaultShareImage);

      // Schema.org ProfilePage JSON-LD Graph
      try {
        const existingScript = document.querySelector('script[type="application/ld+json"]');
        const profileStructuredData = {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebSite',
              '@id': `${canonicalDomain}/#website`,
              url: `${canonicalDomain}/`,
              name: siteName,
              description: baseDescription,
              inLanguage: 'en-US',
              publisher: {
                '@id': `${canonicalDomain}/#person`
              }
            },
            {
              '@type': 'Person',
              '@id': `${canonicalDomain}/#person`,
              name: professionalName,
              alternateName: ['Ev Dr. Boniphace J. Ndege', 'Dr. Boniphace J. Ndege', 'Boniphace J. Ndege', 'Boniphace'],
              jobTitle: titlesString,
              description: baseDescription,
              url: `${canonicalDomain}/`,
              image: defaultShareImage,
              email: profile.email || 'drboniphacendege@gmail.com',
              telephone: profile.phone || '+255 765 326 515',
              address: {
                '@type': 'PostalAddress',
                addressLocality: profile.location || 'Dodoma CBD',
                addressRegion: 'Dodoma',
                addressCountry: 'Tanzania'
              },
              sameAs: [
                'https://github.com/boniphacendege',
                'https://linkedin.com/in/boniphace-ndege',
                'https://behance.net/boniphacendege',
                'https://dribbble.com/boniphacendege',
                'https://instagram.com/boniphace.designs',
                'https://facebook.com/boniphacendege',
                'https://x.com/boniphacendege'
              ],
              knowsAbout: [
                'Graphic Design',
                'Visual Branding & Brand Identity Systems',
                'Flyer and Poster Design',
                'Packaging & Label Design',
                'Website Design',
                'Responsive Web Development',
                'HTML5, CSS3, Tailwind CSS',
                'JavaScript, TypeScript, React',
                'Digital Content Creation',
                'AI-Assisted Design Workflows',
                'Prompt Engineering',
                'UI/UX Design & Prototyping'
              ]
            },
            {
              '@type': 'ProfilePage',
              '@id': `${canonicalDomain}/#profilepage`,
              url: `${canonicalDomain}/`,
              name: `${professionalName} — Professional Portfolio`,
              isPartOf: {
                '@id': `${canonicalDomain}/#website`
              },
              mainEntity: {
                '@id': `${canonicalDomain}/#person`
              },
              dateCreated: '2024-01-01',
              dateModified: '2026-11-01',
              inLanguage: 'en-US'
            }
          ]
        };

        if (existingScript) {
          existingScript.textContent = JSON.stringify(profileStructuredData, null, 2);
        }
      } catch (e) {
        console.warn('Could not update base profile JSON-LD script', e);
      }
    }

    return () => {
      removeCustomProjectTags();
    };
  }, [profile, activeProject]);
}
