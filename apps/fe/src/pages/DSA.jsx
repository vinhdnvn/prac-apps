import { useNavigate } from 'react-router-dom'
import PracticeCard from '../components/PracticeCard'

// ─── Problems data ────────────────────────────────────────────────────────────

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
  {
    id: 4,
    title: 'Search Insert Position',
    difficulty: 'easy',
    tags: ['Array', 'Binary Search'],
    description: 'Given a sorted array and a target, return the index if found. If not, return the index where it would be inserted.',
    explanation: [
      { type: 'text', value: 'Về cơ bản là Binary Search — nhưng thay vì return -1 khi không tìm thấy, ta return left.' },
      { type: 'text', value: 'Tại sao return left lại đúng?' },
      { type: 'step', num: '→', value: 'Khi vòng lặp kết thúc (left > right), left đang trỏ vào vị trí đầu tiên mà nums[left] > target.' },
      { type: 'step', num: '→', value: 'Tức là mọi phần tử bên trái left đều < target, mọi phần tử từ left trở đi đều >= target.' },
      { type: 'step', num: '→', value: 'Đây chính xác là vị trí cần insert để mảng vẫn giữ nguyên thứ tự sort.' },
      { type: 'text', value: 'Ví dụ: nums = [1, 3, 5, 6], target = 2 → left dừng ở index 1 (chỗ của số 3), vì 2 phải nằm trước 3.' },
    ],
    code: {
      lang: 'python',
      complexity: 'O(log n)',
      value: `def searchInsert(nums, target):
    left, right = 0, len(nums) - 1

    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return left  # vị trí insert nếu không tìm thấy`,
    },
  },
  {
    id: 3,
    title: 'Sqrt(x)',
    difficulty: 'easy',
    tags: ['Math', 'Binary Search'],
    description: 'Given a non-negative integer x, return the square root of x rounded down to the nearest integer.',
    explanation: [
      { type: 'text', value: 'Tìm căn bậc 2 nguyên của x — tức là số lớn nhất r sao cho r * r <= x.' },
      { type: 'text', value: 'Approach 1 — Newton\'s method: O(log x). Dùng công thức xấp xỉ r = (r + x/r) // 2, hội tụ rất nhanh.' },
      { type: 'step', num: '→', value: 'Bắt đầu r = x, lặp cho đến khi r * r <= x.' },
      { type: 'text', value: 'Approach 2 — Binary Search: O(log x). Tìm kiếm nhị phân trong khoảng [0, x], lưu lại mid mỗi khi mid * mid <= x.' },
      { type: 'step', num: '1', value: 'left = 0, right = x, ans = 0' },
      { type: 'step', num: '2', value: 'mid = (left + right) // 2' },
      { type: 'step', num: '3', value: 'Nếu mid * mid <= x → ans = mid, tìm tiếp bên phải (left = mid + 1)' },
      { type: 'step', num: '4', value: 'Nếu mid * mid > x → thu hẹp bên trái (right = mid - 1)' },
      { type: 'step', num: '5', value: 'Kết thúc khi left > right → return ans' },
    ],
    code: {
      lang: 'python',
      complexity: 'O(log x) · Binary Search',
      value: `def mySqrt(x):
    ## Approach 1 -> Newton's method -> fastest
    # r = x
    # while r * r > x:
    #     r = (r + x // r) // 2
    # return int(r)

    ## Approach 2 -> Binary Search -> O(log x)
    left, right = 0, x
    ans = 0
    while left <= right:
        mid = (left + right) // 2
        if mid * mid <= x:
            ans = mid
            left = mid + 1   # còn có thể lớn hơn
        else:
            right = mid - 1  # quá lớn, thu hẹp lại
    return ans`,
    },
  },
  {
    id: 5,
    title: 'Arrange Coins',
    difficulty: 'easy',
    tags: ['Math', 'Binary Search', 'Quadratic Formula'],
    description: 'Cho n coins, xây staircase: row i cần đúng i coins. Row cuối có thể không hoàn thành. Return số row hoàn chỉnh.',
    link: '/dsa/arrange-coins',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

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
            onClick={p.link ? () => navigate(p.link) : undefined}
            isLink={!!p.link}
          />
        ))}
      </div>
    </div>
  )
}
