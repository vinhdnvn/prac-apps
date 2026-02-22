import { useNavigate } from 'react-router-dom'
import PracticeCard from '../components/PracticeCard'

const problems = [
  {
    id: 1,
    title: 'Binary Search',
    difficulty: 'easy',
    tags: ['Array', 'Binary Search'],
    description: 'Find a target in a sorted array in O(log n) time.',
    explanation: [
      { type: 'text', value: 'Thay vì duyệt từng phần tử O(n), Binary Search chia đôi mảng mỗi bước — chỉ hoạt động khi mảng đã được sort.' },
      { type: 'step', num: '1', value: 'Đặt 2 pointer: left = 0, right = len - 1' },
      { type: 'step', num: '2', value: 'Tính mid = (left + right) // 2' },
      { type: 'step', num: '3', value: 'Nếu nums[mid] == target → return mid' },
      { type: 'step', num: '4', value: 'Nếu nums[mid] < target → left = mid + 1 (tìm bên phải)' },
      { type: 'step', num: '5', value: 'Nếu nums[mid] > target → right = mid - 1 (tìm bên trái)' },
      { type: 'step', num: '6', value: 'Lặp lại đến khi left > right → return -1 (không tìm thấy)' },
    ],
    code: {
      lang: 'python',
      complexity: 'O(log n)',
      value: `def search(nums, target):
    left, right = 0, len(nums) - 1

    while left <= right:
        mid = (left + right) // 2

        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1   # tìm bên phải
        else:
            right = mid - 1  # tìm bên trái

    return -1  # không tìm thấy`,
    },
  },
  {
    id: 2,
    title: 'Missing Number',
    difficulty: 'easy',
    tags: ['Array', 'Math', 'Bit Manipulation'],
    description: 'Given an array of n distinct numbers in range [0, n], find the missing number.',
    explanation: [
      { type: 'text', value: 'Cho mảng nums gồm n số phân biệt trong khoảng [0, n] — tìm số duy nhất bị thiếu.' },
      { type: 'text', value: 'Approach 1 — Sort + Scan: O(n log n). Sort rồi duyệt kiểm tra nums[i] != i.' },
      { type: 'text', value: 'Approach 2 — XOR: O(n). XOR toàn bộ [0..n] với toàn bộ nums. Số nào không có cặp sẽ còn lại.' },
      { type: 'step', num: '→', value: 'Vì a ^ a = 0 và a ^ 0 = a, nên mọi số có mặt đều triệt tiêu nhau.' },
    ],
    code: {
      lang: 'python',
      complexity: 'O(n) · XOR',
      value: `def missingNumber(nums):
    # give array nums
    # containing n distinct number in range [0, n]
    # output -> return the only number missing from the array

    ## Approach 1 -> Sort + Linear Scan -> O(n log n)
    # nums.sort()
    # i = 0
    # while i < len(nums):
    #     if nums[i] != i:
    #         return i
    #     i += 1
    # return len(nums)

    ## Approach 2 -> XOR -> O(n)
    x = 0
    for i in range(len(nums) + 1):
        x ^= i
    for v in nums:
        x ^= v
    return x`,
    },
  },
]

export default function DSA() {
  const navigate = useNavigate()

  return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate('/')}>← Back</button>

      <h1 className="page-title">DSA</h1>
      <p className="page-tags">Everything implement in Data structures and Algorithms</p>

      <div className="dsa-cards">
        {problems.map(p => (
          <PracticeCard
            key={p.id}
            title={p.title}
            difficulty={p.difficulty}
            tags={p.tags}
            description={p.description}
            explanation={p.explanation}
            code={p.code}
          />
        ))}
      </div>
    </div>
  )
}
