import { Post, Story, User } from '../types';

// 더미 사용자 데이터
export const dummyUsers: User[] = [
  {
    id: '0',
    username: '김민준',
    full_name: '김민준',
    email: 'minjun@example.com',
    profile_picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
    bio: '안녕하세요! 사진 찍는걸 좋아합니다 📸',
    website: 'https://minjun.blog',
    is_private: false,
    is_verified: false,
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: '1',
    username: '이지우',
    full_name: '이지우',
    email: 'jiwoo@example.com',
    profile_picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    bio: '여행과 음식을 사랑해요 ✈️🍕',
    website: '',
    is_private: false,
    is_verified: true,
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: '2',
    username: '박서연',
    full_name: '박서연',
    email: 'seoyeon@example.com',
    profile_picture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    bio: '개발자 | 커피 중독자 ☕',
    website: 'https://github.com/seoyeon',
    is_private: false,
    is_verified: true,
    created_at: '2025-01-02T00:00:00Z'
  },
  {
    id: '3',
    username: '최하준',
    full_name: '최하준',
    email: 'hajun@example.com',
    profile_picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
    bio: '일상을 기록합니다 🌸',
    website: '',
    is_private: false,
    is_verified: false,
    created_at: '2025-01-03T00:00:00Z'
  },
  {
    id: '4',
    username: '정유진',
    full_name: '정유진',
    email: 'yujin@example.com',
    profile_picture: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
    bio: '운동과 건강한 삶 💪',
    website: 'https://yujin.fitness',
    is_private: false,
    is_verified: true,
    created_at: '2025-01-04T00:00:00Z'
  },
  {
    id: '5',
    username: '강소연',
    full_name: '강소연',
    email: 'soyeon@example.com',
    profile_picture: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop',
    bio: '예술과 디자인 🎨',
    website: '',
    is_private: false,
    is_verified: true,
    created_at: '2025-01-05T00:00:00Z'
  }
];

// 더미 게시글 데이터
export const dummyPosts: Post[] = [
  {
    id: '1',
    caption: '제주도 성산일출봉에서 🌅 매번 와도 감동적인 일출이에요! 오렌지빛 하늘과 푸른 바다의 조화가 정말 아름답네요 ✨ #제주도 #성산일출봉 #일출',
    location: '성산일출봉, 제주도',
    created_at: '2025-01-20T18:30:00Z',
    user: dummyUsers[0],
    images: [
      {
        id: '1-1',
        image_url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1080&h=1080&fit=crop',
        position: 0,
        order_index: 0
      },
      {
        id: '1-2',
        image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1080&h=1080&fit=crop',
        position: 1,
        order_index: 1
      }
    ],
    likes_count: 1234,
    comments_count: 89,
    is_liked: false
  },
  {
    id: '2',
    caption: '강남 맛집 발견! 🥩🔥 한우 마블링 보세요 대박이죠? 김치와 소주 한잔이면 완벽한 저녁이에요 🍶 #한우맛집 #강남맛집 #소고기',
    location: '강남구, 서울',
    created_at: '2025-01-19T20:00:00Z',
    user: dummyUsers[1],
    images: [
      {
        id: '2-1',
        image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1080&h=1080&fit=crop',
        position: 0,
        order_index: 0
      }
    ],
    likes_count: 892,
    comments_count: 45,
    is_liked: true
  },
  {
    id: '3',
    caption: '오늘도 운동 완료! 💪 꾸준함이 답입니다. 완벽하지 않아도 괜찮아요, 일단 시작하세요! #운동 #헬스 #동기부여',
    location: '피트니스 센터',
    created_at: '2025-01-19T06:30:00Z',
    user: dummyUsers[2],
    images: [
      {
        id: '3-1',
        image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1080&h=1080&fit=crop',
        position: 0,
        order_index: 0
      },
      {
        id: '3-2',
        image_url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1080&h=1080&fit=crop',
        position: 1,
        order_index: 1
      },
      {
        id: '3-3',
        image_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1080&h=1080&fit=crop',
        position: 2,
        order_index: 2
      }
    ],
    likes_count: 567,
    comments_count: 34,
    is_liked: false
  },
  {
    id: '4',
    caption: '다음주 새로운 전시 오픈! "디지털 드림" - AI와 전통 예술의 만남 🎨🤖 미리보기 작품들 구경하세요 →',
    location: '서울 현대미술관',
    created_at: '2025-01-18T15:45:00Z',
    user: dummyUsers[3],
    images: [
      {
        id: '4-1',
        image_url: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=1080&h=1080&fit=crop',
        position: 0,
        order_index: 0
      },
      {
        id: '4-2',
        image_url: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=1080&h=1080&fit=crop',
        position: 1,
        order_index: 1
      },
      {
        id: '4-3',
        image_url: 'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=1080&h=1080&fit=crop',
        position: 2,
        order_index: 2
      },
      {
        id: '4-4',
        image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1080&h=1080&fit=crop',
        position: 3,
        order_index: 3
      }
    ],
    likes_count: 2341,
    comments_count: 156,
    is_liked: true
  },
  {
    id: '5',
    caption: '맥북 프로 M3 언박싱! 🎁💻 성능이 정말 미쳤어요. 자세한 리뷰는 내일 블로그에서 확인하세요! #맥북프로 #애플 #테크리뷰',
    location: '테크 스튜디오',
    created_at: '2025-01-18T10:00:00Z',
    user: dummyUsers[4],
    images: [
      {
        id: '5-1',
        image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1080&h=1080&fit=crop',
        position: 0,
        order_index: 0
      },
      {
        id: '5-2',
        image_url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=1080&h=1080&fit=crop',
        position: 1,
        order_index: 1
      }
    ],
    likes_count: 1892,
    comments_count: 234,
    is_liked: false
  },
  {
    id: '6',
    caption: '벚꽃이 만개했어요 🌸 서울에도 봄이 왔네요! 한강 피크닉 가기 좋은 날씨예요 🧺 #벚꽃 #여의도 #봄',
    location: '여의도 한강공원',
    created_at: '2025-01-17T14:20:00Z',
    user: dummyUsers[0],
    images: [
      {
        id: '6-1',
        image_url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1080&h=1080&fit=crop',
        position: 0,
        order_index: 0
      }
    ],
    likes_count: 3456,
    comments_count: 267,
    is_liked: true
  }
];

// 더미 스토리 데이터
export const dummyStories: Story[] = [
  {
    id: '1',
    user: dummyUsers[0],
    items: [
      {
        id: 's1-1',
        media_url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1080&h=1920&fit=crop',
        media_type: 'image',
        created_at: '2025-01-21T10:00:00Z',
        is_viewed: false
      },
      {
        id: 's1-2',
        media_url: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1080&h=1920&fit=crop',
        media_type: 'image',
        created_at: '2025-01-21T11:00:00Z',
        is_viewed: false
      }
    ],
    unviewed_count: 2
  },
  {
    id: '2',
    user: dummyUsers[1],
    items: [
      {
        id: 's2-1',
        media_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1080&h=1920&fit=crop',
        media_type: 'image',
        created_at: '2025-01-21T09:00:00Z',
        is_viewed: true
      }
    ],
    unviewed_count: 0
  },
  {
    id: '3',
    user: dummyUsers[2],
    items: [
      {
        id: 's3-1',
        media_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=1080&h=1920&fit=crop',
        media_type: 'image',
        created_at: '2025-01-21T08:00:00Z',
        is_viewed: false
      }
    ],
    unviewed_count: 1
  },
  {
    id: '4',
    user: dummyUsers[3],
    items: [
      {
        id: 's4-1',
        media_url: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=1080&h=1920&fit=crop',
        media_type: 'image',
        created_at: '2025-01-21T12:00:00Z',
        is_viewed: false
      },
      {
        id: 's4-2',
        media_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1080&h=1920&fit=crop',
        media_type: 'image',
        created_at: '2025-01-21T12:30:00Z',
        is_viewed: false
      },
      {
        id: 's4-3',
        media_url: 'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=1080&h=1920&fit=crop',
        media_type: 'image',
        created_at: '2025-01-21T13:00:00Z',
        is_viewed: false
      }
    ],
    unviewed_count: 3
  }
];

// 현재 사용자 (로그인한 사용자)
export const currentUser: User = {
  id: 'current',
  username: 'current_user',
  full_name: '김현재',
  email: 'me@example.com',
  profile_picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
  bio: '📸 사진 찍기 좋아해요\n✈️ 여행 다니는 중\n🌟 행복한 일상 기록',
  website: '',
  is_private: false,
  is_verified: false,
  created_at: '2025-01-01T00:00:00Z'
};