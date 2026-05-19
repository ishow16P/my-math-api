export const EXAM_SESSION_CONFIG = {
  pre_test:   { label: 'ทดสอบก่อนเรียน',       questionCount: 2, duration: 2400 },
  in_class_1: { label: 'ทดสอบท้ายคาบ ครั้งที่ 1', questionCount: 1, duration: 1200 },
  in_class_2: { label: 'ทดสอบท้ายคาบ ครั้งที่ 2', questionCount: 1, duration: 1200 },
  in_class_3: { label: 'ทดสอบท้ายคาบ ครั้งที่ 3', questionCount: 1, duration: 1200 },
  post_test:  { label: 'ทดสอบหลังเรียน',        questionCount: 2, duration: 2400 },
}

export const EXAM_TYPES = Object.keys(EXAM_SESSION_CONFIG)
