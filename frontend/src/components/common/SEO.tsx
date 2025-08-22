import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
}

const SEO = ({
  title = '먹스타그램',
  description = '음식 사진과 맛집 정보를 공유하는 소셜 네트워크. 레시피, 맛집 리뷰, 홈쿠킹 사진을 공유하고 소통하세요.',
  keywords = '먹스타그램, 음식 SNS, 맛집, 레시피, 음식 사진, 푸드스타그램, 맛스타그램, 먹방, 요리, 홈쿠킹, mukstagram, muksta',
  image = 'https://muksta.com/kakao-og-image.png',
  url = 'https://muksta.com',
  type = 'website'
}: SEOProps) => {
  const fullTitle = title === '먹스타그램' ? '먹스타그램 - 맛있는 순간을 공유하세요' : `${title} | 먹스타그램`;

  return (
    <Helmet>
      {/* 기본 메타태그 */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="먹스타그램" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:locale" content="ko_KR" />
      
      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@mukstagram" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* 추가 SEO */}
      <link rel="canonical" href={url} />
      <meta name="robots" content="index, follow" />
      
      {/* 구조화된 데이터 (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "먹스타그램",
          "alternateName": "Mukstagram",
          "url": "https://muksta.com",
          "description": description,
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://muksta.com/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        })}
      </script>
    </Helmet>
  );
};

export default SEO;