-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: cinema_db
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `booking_concessions`
--

DROP TABLE IF EXISTS `booking_concessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `booking_concessions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `booking_id` bigint(20) unsigned NOT NULL,
  `concession_id` bigint(20) unsigned NOT NULL,
  `quantity` tinyint(3) unsigned NOT NULL,
  `price` decimal(10,0) NOT NULL COMMENT 'Giá tại thời điểm đặt',
  PRIMARY KEY (`id`),
  KEY `booking_concessions_booking_id_foreign` (`booking_id`),
  KEY `booking_concessions_concession_id_foreign` (`concession_id`),
  CONSTRAINT `booking_concessions_booking_id_foreign` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `booking_concessions_concession_id_foreign` FOREIGN KEY (`concession_id`) REFERENCES `concessions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `booking_concessions`
--

LOCK TABLES `booking_concessions` WRITE;
/*!40000 ALTER TABLE `booking_concessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `booking_concessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `booking_seats`
--

DROP TABLE IF EXISTS `booking_seats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `booking_seats` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `booking_id` bigint(20) unsigned NOT NULL,
  `seat_id` bigint(20) unsigned NOT NULL,
  `price` decimal(10,0) NOT NULL COMMENT 'Giá tại thời điểm đặt',
  PRIMARY KEY (`id`),
  UNIQUE KEY `booking_seats_booking_id_seat_id_unique` (`booking_id`,`seat_id`),
  KEY `booking_seats_seat_id_foreign` (`seat_id`),
  CONSTRAINT `booking_seats_booking_id_foreign` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `booking_seats_seat_id_foreign` FOREIGN KEY (`seat_id`) REFERENCES `seats` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `booking_seats`
--

LOCK TABLES `booking_seats` WRITE;
/*!40000 ALTER TABLE `booking_seats` DISABLE KEYS */;
INSERT INTO `booking_seats` VALUES (1,1,425,60000),(2,2,626,60000),(3,2,627,60000),(4,3,665,60000),(5,3,666,60000),(6,4,676,60000),(7,5,703,60000),(8,5,702,60000),(9,6,775,60000),(10,6,774,60000),(11,7,776,60000),(12,8,655,60000),(13,9,375,150000),(14,10,426,60000),(15,11,333,80000),(16,12,718,60000),(17,13,675,60000),(18,13,674,60000),(19,14,381,60000),(20,15,382,60000),(21,16,383,60000),(22,17,445,60000),(23,18,446,60000),(24,18,445,60000),(25,19,398,60000),(26,20,435,60000),(27,20,436,60000),(28,21,426,60000),(29,22,425,60000),(30,23,447,60000),(31,24,427,60000),(32,25,437,60000),(33,26,444,60000),(34,27,434,60000),(35,28,444,60000),(36,29,436,60000),(37,29,437,60000),(38,30,447,60000),(39,31,435,60000);
/*!40000 ALTER TABLE `booking_seats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bookings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `showtime_id` bigint(20) unsigned NOT NULL,
  `total_amount` decimal(12,0) NOT NULL COMMENT 'Tổng tiền (VNĐ)',
  `status` enum('pending','paid','cancelled','used') NOT NULL DEFAULT 'pending',
  `qr_code` varchar(255) DEFAULT NULL COMMENT 'UUID định danh vé',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bookings_qr_code_unique` (`qr_code`),
  KEY `bookings_user_id_foreign` (`user_id`),
  KEY `bookings_showtime_id_foreign` (`showtime_id`),
  CONSTRAINT `bookings_showtime_id_foreign` FOREIGN KEY (`showtime_id`) REFERENCES `showtimes` (`id`),
  CONSTRAINT `bookings_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (1,4,1,60000,'used','de6923e6-eaf9-41c6-b0a1-43df7ee2fb15','2026-03-21 21:00:50','2026-03-21 21:02:26'),(2,4,4,120000,'used','0503c97e-dd46-4320-a3d6-9e9cd81864c4','2026-03-22 02:18:28','2026-03-22 02:18:55'),(3,4,3,120000,'paid','dbd95181-49d9-4da2-84d7-302a57d38566','2026-03-22 03:52:06','2026-03-22 03:52:07'),(4,4,3,60000,'used','cc19ef98-8f73-4d0f-85e2-8e1363dbe2b0','2026-03-22 04:16:44','2026-03-22 04:17:01'),(5,5,3,120000,'paid','9f31dfdd-fd62-4b65-97c6-018f9a272d76','2026-03-22 04:42:34','2026-03-22 04:42:35'),(6,4,7,120000,'used','2f4e3a2e-d211-4cad-9ef7-624893528617','2026-03-22 06:12:18','2026-03-22 06:15:50'),(7,1,7,60000,'paid','66485ac9-5162-41fd-a2eb-bf7a92422c02','2026-03-22 06:20:17','2026-03-22 06:20:19'),(8,4,3,60000,'paid','98950b33-40cf-4f3d-8864-4198b1c0b738','2026-03-22 07:59:45','2026-03-22 07:59:46'),(9,4,5,150000,'paid','8d8380ef-b218-4924-9731-b3725ecf7799','2026-03-22 08:10:17','2026-03-22 08:10:18'),(10,4,6,60000,'used','d8eea30c-bd40-40d3-bc10-a8e5fb703a0e','2026-03-22 08:14:23','2026-03-22 08:14:37'),(11,4,5,80000,'paid','4cdac42f-5548-419a-8df2-b839799f5244','2026-03-22 08:31:31','2026-03-22 08:31:32'),(12,4,4,60000,'used','ac3d5f3b-242a-4bee-b6d0-3e6b79c06e67','2026-03-22 08:33:34','2026-03-22 09:52:12'),(13,1,3,120000,'used','ff2595f4-1b2d-41d7-af3c-f81e16e2e2c5','2026-03-22 09:49:24','2026-03-22 09:49:25'),(14,4,2,60000,'paid','58363797-ec37-45db-ab5f-e5b31b67cd45','2026-05-04 18:41:12','2026-05-04 18:41:12'),(15,4,2,60000,'paid','4c0c5bc3-7a59-447b-8434-b135c4f6fe96','2026-05-04 18:41:12','2026-05-04 18:41:12'),(16,4,2,60000,'paid','1905f17c-d3bc-486c-9895-6d6c99559a83','2026-05-04 18:41:12','2026-05-04 18:41:12'),(17,4,2,60000,'cancelled','https://img.vietqr.io/image/970415-113366668888-compact2.png?amount=060000&addInfo=CINEMA%20BOOKING%2017&accountName=CINEMA%20BOOKING','2026-05-04 18:41:12','2026-05-04 18:41:12'),(18,1,12,120000,'used','a64a798d-214a-494a-8f6d-aca0f3fba43e','2026-05-04 18:41:12','2026-05-04 18:41:12'),(19,4,12,60000,'cancelled','https://img.vietqr.io/image/970415-113366668888-compact2.png?amount=060000&addInfo=CINEMA%20BOOKING%2019&accountName=CINEMA%20BOOKING','2026-05-04 18:41:12','2026-05-04 18:41:12'),(20,1,12,120000,'cancelled','https://img.vietqr.io/image/970415-113366668888-compact2.png?amount=120000&addInfo=CINEMA%20BOOKING%2020&accountName=CINEMA%20BOOKING','2026-05-04 18:41:12','2026-05-04 18:41:12'),(21,1,12,60000,'cancelled','https://img.vietqr.io/image/970415-113366668888-compact2.png?amount=60000&addInfo=CINEMA%20BOOKING%2021&accountName=CINEMA%20BOOKING','2026-05-04 18:41:12','2026-05-04 18:41:12'),(22,1,12,60000,'cancelled','https://img.vietqr.io/image/970422-9120320049999-compact2.png?amount=60000&addInfo=CINEMA%20BOOKING%2022&accountName=LE%20HUU%20LOI','2026-05-04 18:41:12','2026-05-04 18:41:12'),(23,1,12,60000,'cancelled','https://img.vietqr.io/image/970422-9120320049999-compact2.png?amount=60000&addInfo=CINEMA%20BOOKING%2023&accountName=LE%20HUU%20LOI','2026-05-04 18:41:12','2026-05-04 18:41:12'),(24,1,12,60000,'cancelled','https://img.vietqr.io/image/970422-9120320049999-compact2.png?amount=60000&addInfo=CINEMA%20BOOKING%2024&accountName=LE%20HUU%20LOI','2026-05-04 18:41:12','2026-05-04 18:41:12'),(25,1,12,60000,'cancelled','https://img.vietqr.io/image/970422-9120320049999-compact2.png?amount=60000&addInfo=CINEMA%20BOOKING%2025&accountName=LE%20HUU%20LOI','2026-05-04 18:41:12','2026-05-04 18:41:12'),(26,1,12,60000,'cancelled','https://img.vietqr.io/image/970422-9120320049999-compact2.png?amount=60000&addInfo=CINEMA%20BOOKING%2026&accountName=LE%20HUU%20LOI','2026-05-04 18:41:12','2026-05-04 18:41:12'),(27,1,12,60000,'used','98a2f8be-9910-425b-80bd-85d87a9a84a5','2026-05-04 18:41:12','2026-05-04 18:41:12'),(28,1,12,60000,'cancelled','https://img.vietqr.io/image/970422-9120320049999-compact2.png?amount=60000&addInfo=CINEMA%20BOOKING%2028&accountName=LE%20HUU%20LOI','2026-05-04 19:44:27','2026-05-04 19:44:27'),(29,1,12,120000,'used','2d85c61a-2953-40f8-ba96-b84d04305b4f','2026-05-05 00:00:06','2026-05-05 00:00:06'),(30,1,12,60000,'cancelled','https://img.vietqr.io/image/970422-9120320049999-compact2.png?amount=60000&addInfo=CINEMA%20BOOKING%2030&accountName=LE%20HUU%20LOI','2026-05-05 00:36:20','2026-05-05 00:36:20'),(31,1,14,60000,'cancelled','https://img.vietqr.io/image/970422-9120320049999-compact2.png?amount=60000&addInfo=CINEMA%20BOOKING%2031&accountName=LE%20HUU%20LOI','2026-05-05 00:41:14','2026-05-05 00:41:14');
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `concessions`
--

DROP TABLE IF EXISTS `concessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `concessions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,0) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `image` varchar(500) DEFAULT NULL COMMENT 'image_url',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `concessions`
--

LOCK TABLES `concessions` WRITE;
/*!40000 ALTER TABLE `concessions` DISABLE KEYS */;
INSERT INTO `concessions` VALUES (1,'B?p rang bo nh?','B?p rang bo v?a v?n cho 1 ngu?i',39000,1,NULL,NULL,NULL),(2,'B?p rang bo l?n','B?p rang bo c? d?i, d? cho 2 ngu?i',55000,1,NULL,NULL,NULL),(3,'Nu?c ng?t Pepsi','Pepsi lon 330ml u?p l?nh',25000,1,NULL,NULL,NULL),(4,'Nu?c su?i Aquafina','Aquafina 500ml',15000,1,NULL,NULL,NULL),(5,'Combo d¶i','B?p rang bo l?n + 2 Pepsi',99000,1,NULL,NULL,NULL);
/*!40000 ALTER TABLE `concessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'2014_10_12_000000_create_users_table',1),(2,'2014_10_12_100000_create_password_resets_table',1),(3,'2019_08_19_000000_create_failed_jobs_table',1),(4,'2019_12_14_000001_create_personal_access_tokens_table',1),(5,'2024_01_01_000001_create_movies_table',1),(6,'2024_01_01_000002_create_rooms_table',1),(7,'2024_01_01_000003_create_seats_table',1),(8,'2024_01_01_000004_create_showtimes_table',1),(9,'2024_01_01_000005_create_bookings_table',1),(10,'2024_01_01_000006_create_booking_seats_table',1),(11,'2024_01_01_000007_create_seat_locks_table',1),(12,'2024_01_01_000008_create_payments_table',1),(13,'2024_01_01_000009_create_concessions_table',1),(14,'2024_01_01_000010_create_booking_concessions_table',1),(15,'2026_03_22_003157_add_director_and_cast_to_movies_table',1),(16,'2026_03_22_100229_add_genre_and_rated_to_movies_table',2),(17,'2026_03_22_103103_add_format_to_showtimes_table',3),(18,'2026_03_22_110242_create_reviews_table',4),(19,'2026_03_22_160937_add_stopped_status_to_movies',5);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movies`
--

DROP TABLE IF EXISTS `movies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `movies` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `duration` smallint(5) unsigned NOT NULL COMMENT 'Thời lượng (phút)',
  `trailer_url` varchar(500) DEFAULT NULL,
  `genre` varchar(255) DEFAULT NULL,
  `rated` varchar(255) NOT NULL DEFAULT 'P',
  `poster` varchar(500) DEFAULT NULL,
  `release_date` date NOT NULL,
  `status` enum('now_showing','coming_soon','stopped') DEFAULT 'coming_soon',
  `director` varchar(255) DEFAULT NULL,
  `cast` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movies`
--

LOCK TABLES `movies` WRITE;
/*!40000 ALTER TABLE `movies` DISABLE KEYS */;
INSERT INTO `movies` VALUES (5,'ĐẾM NGÀY XA MẸ','Đếm Ngày Xa Mẹ xoay quanh cặp mẹ con Eun-sil (Jang Hye-jin) và Ha-min (Choi Woo-shik). Mỗi lần ăn một món do mẹ nấu, Ha-min lại nhìn thấy một con số khó lý giải. Sau mỗi bữa ăn, con số ấy giảm đi một đơn vị. Ha-min sớm nhận ra một sự thật kinh hoàng: khi con số chạm về 0, mẹ anh sẽ qua đời. Kể từ đó, cuộc sống bình thường của Ha-min bị đảo lộn hoàn toàn. Để bảo vệ quãng thời gian còn lại của mẹ, Ha-min bắt đầu tránh xa những bữa cơm nhà, viện đủ mọi lý do để không phải ngồi vào bàn ăn và dần trở nên xa cách với mẹ. Liệu thời gian để Hamin ở bên mẹ còn được bao lâu nữa?',109,'https://www.youtube.com/watch?v=Dp-3zxsfWbw',NULL,'P','posters/ICviSiNn8NhFigHmtjjsTDV9238AMGFNp4ZnyBdk.jpg','2026-03-20','now_showing','Kim Tae-yong','Choi Woo-shik, Jang Hye-jin, Gong Seung-yeon','2026-03-21 20:27:42','2026-03-21 20:27:42'),(6,'QUỶ NHẬP TRÀNG 2','Quỷ Nhập Tràng 2 là tiền truyện của nhân vật Minh Như, trở về xưởng nhuộm gia đình sau nhiều năm bị xua đuổi. Tại đây, cô phải đối mặt với những hiện tượng ma quái cùng sự thật tàn khốc về cái chết của mẹ và giao ước đẫm máu năm xưa. Ác giả ác báo, liệu Minh Như có thoát khỏi vòng vây của quỷ dữ?',126,'https://www.youtube.com/watch?v=VCI9XTxlQxk&t=1s',NULL,'P','posters/FZqMHbv5CZNLZrP6fWWF7oy3YAcUHp3hDTBudND6.jpg','2026-03-13','now_showing','Pom Nguyễn','Khả Như, Doãn Quốc Đam, Ngọc Hương...','2026-03-21 20:29:40','2026-03-21 20:30:07'),(7,'Tài','Tài bất ngờ rơi vào vòng xoáy nguy hiểm vì một khoản nợ tiền khổng lồ. Bị dồn vào đường cùng, Tài buộc phải dấn thân vào những lựa chọn sai lầm khiến gia đình trở thành mục tiêu bị đe dọa. Đằng sau những hành động liều lĩnh ấy là nỗi ám ảnh về người mẹ mà Tài luôn muốn bảo vệ và bù đắp bằng mọi giá. Khi ranh giới giữa đúng và sai ngày càng mong manh, Tài phải đối mặt với câu hỏi lớn nhất của đời mình: liệu lòng hiếu thảo có đủ để biện minh cho con đường anh đang đi.',101,'https://www.youtube.com/watch?v=z8H4miEhi-4',NULL,'P','posters/tQsejWkOUt9wpjmcNDwJsrzOJMMGK5DAHv3mb7Pf.jpg','2026-03-06','stopped','Mai Tài Phến','Mai Tài Phến, Mỹ Tâm, NSƯT Hạnh Thuý, Hồng Ánh, Long Đẹp Trai, Vinh Râu, Trần Kim Hải, Sỹ Toàn, Quang Trung, Huỳnh Thi, Ray Nguyễn,...','2026-03-21 20:33:20','2026-03-21 20:35:55'),(8,'THỎ ƠI!!','Phim “Thỏ ơi!!” dự kiến công chiếu trong dịp Tết 2026, thuộc thể loại hài, tâm lý sở trường của Trấn Thành, mang màu sắc trẻ trung với dàn diễn viên mới, tiếp nối tinh thần đem đến cho khán giả những điều vui vẻ, hài hước vào dịp Tết Nguyên đán.',127,'https://www.youtube.com/watch?v=3pzgEbvS9ag',NULL,'T18','posters/qrr86he09oo2rwnD3Wf7B1WfkkfaLeij5NlxEVvQ.jpg','2026-02-17','now_showing','Trấn Thành','Pháo; Lyly; Trấn Thành; Pháp Kiều; Gil Lê; Cris Phan; Ali Hoàng Dương; BB Trần; Đinh Ngọc Diệp','2026-03-21 20:34:50','2026-03-22 03:13:16'),(9,'NHÀ BA TÔI MỘT PHÒNG','Lấy bối cảnh một khu chung cư cũ với căn nhà chỉ vỏn vẹn một phòng, Nhà Ba Tôi Một Phòng khắc họa mối quan hệ “lệch pha” giữa người cha bảo thủ và cô con gái Gen Z đầy mơ ước. Khi những khác biệt thế hệ va chạm trong không gian chật chội, tình thân dần được thử thách và hàn gắn. Bộ phim mang đến một lát cắt gần gũi về gia đình Việt hiện đại, nơi yêu thương đôi khi bắt đầu từ sự thấu hiểu.',126,'https://www.youtube.com/watch?v=gCmV2d_82CU',NULL,'P','posters/6NwArVX8JBa2CKitRkBxU3euiqqEh4exySgS2jEy.jpg','2026-02-17','now_showing','Trường Giang','Trường Giang, Đoàn Minh Anh, Anh Tú Atus, Lê Khánh,…','2026-03-21 20:37:55','2026-03-21 20:37:55'),(10,'CHÚ THUẬT HỒI CHIẾN: BIẾN CỐ SHIBUYA x TỬ DIỆT HỒI DU - THE MOVIE','Sau bao ngày chờ đợi, Đại Chiến Shibuya cuối cùng cũng xuất hiện trên màn ảnh rộng, gom trọn những khoảnh khắc nghẹt thở nhất thành một cú nổ đúng nghĩa. Không chỉ tái hiện toàn bộ cơn ác mộng tại Shibuya, bộ phim còn hé lộ những bí mật then chốt và mở màn cho trò chơi sinh tử “Tử Diệt Hồi Du” đầy kịch tính và mãn nhãn.',88,'https://www.youtube.com/watch?v=EWKm0lolQRM','Anime, Hành động','P','posters/dflcT3SfyDNn4hcLgNzsSoljCDdkckYMSN3ExIVB.jpg','2026-03-12','now_showing','Shouta Goshozono',NULL,'2026-03-21 20:40:25','2026-03-22 09:31:02'),(11,'LA TIỂU HẮC CHIẾN KÝ 2','Sau những ngày yên bình sống cùng sư phụ ở một thị trấn nhỏ, La Tiểu Hắc lại phải đối mặt với một cuộc khủng hoảng mới. Hội quán Lưu Thạch của giới yêu linh bị tấn công bất ngờ, phá vỡ hòa bình giữa thế giới con người và yêu giới. Sự kiện này che giấu rất nhiều bí ẩn đen tối giữa các phe phái và nguy cơ dẫn tới chiến tranh. Trước tình thế đó, Tiểu Hắc cùng sư tỷ Lộc Dã nhận nhiệm vụ và bắt đầu một hành trình phiêu lưu đầy hiểm nguy, tìm ra sự thật đằng sau các vụ tấn công và thủ phạm thực sự để ngăn chặn đổ máu.',120,'https://www.youtube.com/watch?v=yDortsXWWj0',NULL,'P','posters/u7Rn4eQIWWtcgLLbLvcTzmest02IraJhZ9e3jYRH.jpg','2026-03-20','now_showing','MTJJ, Gu Jie','Shan Xin, Liu Mingyue, Zhu Jing, ...','2026-03-21 20:42:24','2026-03-21 20:42:24'),(12,'CẢM ƠN NGƯỜI ĐÃ THỨC CÙNG TÔI','Cảm Ơn Người Đã Thức Cùng Tôi là một hành trình cảm xúc của những người trẻ đi tìm đáp án cho câu hỏi “Ước mơ của bạn là gì?”, để rồi chính họ khi bước vào thế giới trưởng thành dần nhận ra câu hỏi quan trọng nhất là “Mình muốn thực hiện ước mơ đó cùng ai?”',137,'https://www.youtube.com/watch?v=uf2oOeJ-Z3s',NULL,'P','posters/8TBNCf1SzAXwR1yxM4SCh7YtGt3NOZUWRG9EBvJF.jpg','2026-02-27','now_showing','Chung Chí Công','Võ Phan Kim Khánh, Trần Doãn Hoàng, Nguyễn Hùng','2026-03-21 20:46:05','2026-03-21 20:46:05'),(13,'Phim Điện Ảnh Doraemon: Nobita và Lâu Đài Dưới Đáy Biển (Phiên bản mới)','Bước vào kì nghỉ hè, Nobita và các bạn tranh cãi chí chóe về địa điểm cắm trại. Theo đề xuất của Doraemon, cả nhóm quyết định cắm trại giữa lòng đại dương! Sử dụng bảo bối thần kì “xe Buggy chạy dưới nước” và “đèn pin thích nghi”, 5 bạn nhỏ tận hưởng chuyến cắm trại dưới đáy biển, gặp gỡ vô vàn sinh vật lí thú trên đường đi. Sau khi phát hiện một chiếc tàu đắm, nhóm bạn đã gặp chàng thanh niên bí ẩn El. Thật bất ngờ, anh ta lại là cư dân đáy biển, sống tại “liên bang Mu”, một vùng biển rộng lớn! Vốn căm ghét người mặt đất, cư dân đáy biển không thể nào tin tưởng Nobita và các bạn. Đúng lúc đó, lời thông báo “lâu đài quỷ... đã bắt đầu phục sinh!!” được truyền tới. “Lâu đài quỷ” khiến cư dân đáy biển khiếp sợ, rốt cuộc là gì? Đặt trọn niềm tin vào bè bạn trong lồng ngực, chuyến phiêu lưu vĩ đại quyết định số phận của trái đất, bắt đầu!',120,'https://www.youtube.com/watch?v=kv4Kc9EGTKA',NULL,'P','posters/i1cK6zan20L95EgjNEKx26iOZRfstj6tECrAOykO.jpg','2026-05-22','coming_soon','Tetsuo Yajima','Wasabi Mizuta, Megumi Oohara, Yumi Kakazu, Subaru Kimura, Tomokazu Seki,...','2026-03-21 20:51:16','2026-03-21 20:51:16'),(14,'NGƯỜI NHỆN: KHỞI ĐẦU MỚI','Không còn Tony Stark, MJ hay Ned kề cận, Peter buộc phải đơn thân độc mã đối diện với phe đối đầu bí ẩn. Tuy nhiên, khi áp lực ngày càng gia tăng, nó kích hoạt một sự biến đổi thể chất bất ngờ, đe dọa chính sự tồn tại của anh. Đồng thời, một chuỗi tội phạm bí ẩn mới xuất hiện, kéo theo một trong những mối đe dọa mạnh mẽ nhất mà Spider-Man từng đối mặt.',151,'https://www.youtube.com/watch?v=-aUE6APXrc0',NULL,'P','posters/uBoP6qrmX33kh6M1tWDbVRtPoztTalHObYn6KfAM.jpg','2026-07-31','coming_soon','Destin Daniel Cretton','Tom Holland, Zendaya, Sadie Sink','2026-03-21 21:05:01','2026-03-21 21:05:01'),(15,'BÁU VẬT TRỜI CHO','BÁU VẬT TRỜI CHO - bộ phim đa sắc cảm xúc, rực rỡ yêu thương, gắn kết gia đình Tết 2026. Ngọc (Phương Anh Đào) là mẹ đơn thân, có con nhờ thụ tinh nhân tạo từ tinh trùng hiến tặng. Trong chuyến đi biển để đổi gió và trốn chạy quá khứ, cô & Tô chạm mặt Hồng (Tuấn Trần) – chàng trai làng chài phóng khoáng, cũng chính là người góp phần tạo nên sự ra đời của Tô. Cuộc gặp gỡ tréo ngoe ấy kéo ba con người xa lạ vào hàng loạt tình huống dở khóc dở cười lẫn căng thẳng, khi mọi thứ bắt đầu vượt ngoài kế hoạch. Liệu người cha “trời cho” này là món quà bất ngờ của số phận, hay chỉ là một “trò chơi” oái oăm cuộc đời?',124,'https://www.youtube.com/watch?v=dwfUi9SV5ss','Gia đình, Hài, Tình cảm','K','posters/LH1rH4AeMTMvlgDGXT9EZMRCkVrcvkvIpsjKKz8A.jpg','2026-02-17','now_showing','Lê Thanh Sơn','NSND Kim Xuân, Tuấn Trần, Phương Anh Đào, Võ Tấn Phát, Hưng Nguyễn, La Thành, Trung Dân, Khương Lê, Tạ Lâm, Quách Ngọc Ngoan, Chị Phiến, Thư Đan…','2026-03-22 06:08:31','2026-03-22 17:18:45'),(17,'PHÍ PHÔNG: QUỶ MÁU RỪNG THIÊNG','Phí Phông, loài quỷ khát máu trong truyền thuyết dân gian của đồng bào miền núi gây ám ảnh bao đời nay. Phim xoay quanh Còn (Kiều Minh Tuấn) và Dương (Minh Anh), hai pháp sư tập sự lên núi cứu người mẹ đang bị lời nguyền Phí Phông đánh gục. Cùng lúc đó, trong bản sâu cũng xảy ra nhiều cái chết ghê rợn. Mọi nghi ngờ đổ dồn về hai mẹ con Mon (Diệp Bảo Ngọc) và Lua (Nina Nutthacha), những người mang đặc tính y hệt Phí Phông. Thế nhưng, vẫn còn những bí mật động trời bị chôn vùi trong chốn rừng thiêng nước độc, cuốn hai anh em Còn và Dương vào cuộc truy lùng “Phí Phông” không hồi kết.',119,'https://www.youtube.com/watch?v=M39AbAEVGKo','Hồi hộp, Kinh Dị','T16','posters/poster-1777942344352-818694506.jpg','2026-04-21','now_showing','Đỗ Quốc Trung','Kiều Minh Tuấn, Nina Nutthacha Padovan, Diệp Bảo Ngọc, Đoàn Minh Anh, NSƯT Hạnh Thuý,...',NULL,NULL),(18,'HEO NĂM MÓNG','“Heo Năm Móng” được lấy cảm hứng từ một trong những truyền thuyết linh dị huyền bí của cộng đồng người Khmer ở khu vực miền Tây để bật lên thông điệp về nghiệp - quả, về những hệ luỵ khôn lường khi sử dụng niềm tin tín ngưỡng sai chỗ.',103,'https://www.youtube.com/watch?v=V_p3qpDUuz4','Hồi hộp, Kinh Dị','T18','posters/poster-1777942204876-440899782.jpg','2026-04-23','now_showing','Lưu Thành Luân','Võ Tấn Phát, Trần Ngọc Vàng, NSƯT Ốc Thanh Vân, Nghệ Sĩ Thanh Thủy,...',NULL,NULL);
/*!40000 ALTER TABLE `movies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_resets` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `booking_id` bigint(20) unsigned NOT NULL,
  `method` enum('vnpay','momo') NOT NULL,
  `transaction_id` varchar(255) DEFAULT NULL COMMENT 'Mã GD từ cổng thanh toán',
  `amount` decimal(12,0) NOT NULL,
  `status` enum('pending','success','failed') NOT NULL DEFAULT 'pending',
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payments_booking_id_foreign` (`booking_id`),
  CONSTRAINT `payments_booking_id_foreign` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,1,'vnpay','test_txn_999',60000,'success','2026-03-21 21:00:51','2026-03-21 21:00:51','2026-03-21 21:00:51'),(2,2,'vnpay','test_txn_999',120000,'success','2026-03-22 02:18:29','2026-03-22 02:18:29','2026-03-22 02:18:29'),(3,3,'vnpay','test_txn_999',120000,'success','2026-03-22 03:52:07','2026-03-22 03:52:07','2026-03-22 03:52:07'),(4,4,'vnpay','test_txn_999',60000,'success','2026-03-22 04:16:46','2026-03-22 04:16:46','2026-03-22 04:16:46'),(5,5,'vnpay','test_txn_999',120000,'success','2026-03-22 04:42:35','2026-03-22 04:42:35','2026-03-22 04:42:35'),(6,6,'vnpay','test_txn_999',120000,'success','2026-03-22 06:12:20','2026-03-22 06:12:20','2026-03-22 06:12:20'),(7,7,'vnpay','test_txn_999',60000,'success','2026-03-22 06:20:19','2026-03-22 06:20:19','2026-03-22 06:20:19'),(8,8,'vnpay','test_txn_999',60000,'success','2026-03-22 07:59:46','2026-03-22 07:59:46','2026-03-22 07:59:46'),(9,9,'vnpay','test_txn_999',150000,'success','2026-03-22 08:10:18','2026-03-22 08:10:18','2026-03-22 08:10:18'),(10,10,'vnpay','test_txn_999',60000,'success','2026-03-22 08:14:24','2026-03-22 08:14:24','2026-03-22 08:14:24'),(11,11,'vnpay','test_txn_999',80000,'success','2026-03-22 08:31:32','2026-03-22 08:31:32','2026-03-22 08:31:32'),(12,12,'vnpay','test_txn_999',60000,'success','2026-03-22 08:33:35','2026-03-22 08:33:35','2026-03-22 08:33:35'),(13,13,'vnpay','test_txn_999',120000,'success','2026-03-22 09:49:25','2026-03-22 09:49:25','2026-03-22 09:49:25'),(14,14,'','TEST_TXN_1777697848181',60000,'success','2026-05-02 04:57:28',NULL,NULL),(15,15,'','TEST_TXN_1777698133124',60000,'success','2026-05-02 05:02:13',NULL,NULL),(16,16,'','TEST_TXN_1777698214158',60000,'success','2026-05-02 05:03:34',NULL,NULL),(17,18,'vnpay','test_txn_999',6000060000,'success','2026-05-04 03:00:26',NULL,NULL),(18,27,'','MOCK_1777920211503',60000,'success','2026-05-04 18:43:31',NULL,NULL),(19,29,'','MOCK_1777939271555',120000,'success','2026-05-05 00:01:11',NULL,NULL);
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
INSERT INTO `personal_access_tokens` VALUES (23,'App\\Models\\User',1,'auth_token','0cdf3052126a53bc9c1b62d70519f637cc313c52d0fc3a0a3519866a2105ecb1','[\"*\"]','2026-03-22 06:20:24',NULL,'2026-03-22 06:19:15','2026-03-22 06:20:24'),(24,'App\\Models\\User',1,'auth_token','486831222fc5b6d662c21670bb78e2b928ff52cdfdcc3518f6829a2f78962de1','[\"*\"]','2026-03-22 07:48:45',NULL,'2026-03-22 07:46:09','2026-03-22 07:48:45'),(25,'App\\Models\\User',1,'auth_token','9af1fd25351465fd8cbd82be68965a2bb0b36b26bde6a119616a4dce8f241ef6','[\"*\"]',NULL,NULL,'2026-03-22 07:48:43','2026-03-22 07:48:43'),(26,'App\\Models\\User',1,'auth_token','eee684a9757b9c059c1d304ea75c3e4bd25fe77db10fb21294e89037c86e5962','[\"*\"]',NULL,NULL,'2026-03-22 07:48:43','2026-03-22 07:48:43'),(27,'App\\Models\\User',1,'auth_token','17b8d334ab7a19b98dd52feb19b9b8271a59a1436b29494cfe6b3e076f0c56aa','[\"*\"]',NULL,NULL,'2026-03-22 07:48:44','2026-03-22 07:48:44'),(28,'App\\Models\\User',1,'auth_token','4c5f075af89a59011597965563b3aefaa45898ae09a69632f7ae3b41998d59d3','[\"*\"]',NULL,NULL,'2026-03-22 07:48:44','2026-03-22 07:48:44'),(29,'App\\Models\\User',1,'auth_token','83b125e4247cef43a6ed81f24502a20334e3a802b3fa02b74f43d40739c801c6','[\"*\"]',NULL,NULL,'2026-03-22 07:48:44','2026-03-22 07:48:44'),(30,'App\\Models\\User',1,'auth_token','bee331c6a5e8fc5a3b754c658700027d7acf9e0c81b0debd244c9fdaaa665839','[\"*\"]',NULL,NULL,'2026-03-22 07:48:45','2026-03-22 07:48:45'),(31,'App\\Models\\User',1,'auth_token','4d3cd37d1ac5b748f8c78d0e879ccce3c1d92e394f5d66057e67539e52b8e0da','[\"*\"]','2026-03-22 10:04:53',NULL,'2026-03-22 07:48:46','2026-03-22 10:04:53'),(32,'App\\Models\\User',1,'auth_token','5bafc03c579956a54040bb1e234f0493b7aa91c27e357430c115daff31de3a46','[\"*\"]','2026-03-22 17:58:08',NULL,'2026-03-22 17:18:01','2026-03-22 17:58:08'),(33,'App\\Models\\User',4,'auth_token','3d5fa1c5a9c727d7004c36f11acd3ae2d8f76f529b0cc593990f3db7cc440224','[\"*\"]','2026-04-09 06:01:12',NULL,'2026-03-22 17:23:50','2026-04-09 06:01:12');
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reviews` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `movie_id` bigint(20) unsigned NOT NULL,
  `rating` tinyint(3) unsigned NOT NULL,
  `comment` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reviews_user_id_movie_id_unique` (`user_id`,`movie_id`),
  KEY `reviews_movie_id_foreign` (`movie_id`),
  CONSTRAINT `reviews_movie_id_foreign` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (1,4,10,3,'Dở','2026-03-22 04:26:57','2026-03-22 09:52:33'),(2,5,10,5,'Phim cũng tạm','2026-03-22 04:43:11','2026-03-22 04:49:05'),(3,1,15,4,'','2026-03-22 06:20:24','2026-03-22 07:59:14'),(4,4,15,5,'phim hay quá','2026-03-22 08:14:07','2026-03-22 08:14:07'),(5,4,11,1,'phim dở','2026-03-22 08:15:11','2026-03-22 08:15:11'),(6,4,12,5,'','2026-05-04 09:49:36','2026-05-04 09:49:36'),(9,1,12,4,'','2026-05-05 00:06:33','2026-05-05 00:06:33');
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rooms` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `type` enum('2D','3D','IMAX','4DX') NOT NULL DEFAULT '2D',
  `total_seats` smallint(5) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rooms_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES (1,'Cinema 1','IMAX',100,'2026-03-21 20:23:17','2026-03-21 20:25:09'),(2,'Cinema 2','3D',180,'2026-03-21 20:23:17','2026-03-21 20:23:17'),(3,'Cinema 3','2D',80,'2026-03-21 20:23:17','2026-03-21 20:23:17'),(4,'Cinema 5','4DX',100,'2026-03-21 22:47:12','2026-03-21 22:47:13'),(5,'Cinema 4','IMAX',150,'2026-03-22 01:54:29','2026-03-22 06:04:19'),(6,'Phòng test','2D',80,'2026-03-22 06:06:00','2026-03-22 10:03:32');
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seat_locks`
--

DROP TABLE IF EXISTS `seat_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `seat_locks` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `showtime_id` bigint(20) unsigned NOT NULL,
  `seat_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `locked_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL COMMENT 'locked_at + 5 phút',
  PRIMARY KEY (`id`),
  UNIQUE KEY `seat_locks_showtime_id_seat_id_unique` (`showtime_id`,`seat_id`),
  KEY `seat_locks_seat_id_foreign` (`seat_id`),
  KEY `seat_locks_user_id_foreign` (`user_id`),
  CONSTRAINT `seat_locks_seat_id_foreign` FOREIGN KEY (`seat_id`) REFERENCES `seats` (`id`) ON DELETE CASCADE,
  CONSTRAINT `seat_locks_showtime_id_foreign` FOREIGN KEY (`showtime_id`) REFERENCES `showtimes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `seat_locks_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=207 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seat_locks`
--

LOCK TABLES `seat_locks` WRITE;
/*!40000 ALTER TABLE `seat_locks` DISABLE KEYS */;
INSERT INTO `seat_locks` VALUES (205,14,416,1,'2026-05-05 01:02:28','2026-05-05 01:07:28'),(206,14,415,1,'2026-05-05 01:02:28','2026-05-05 01:07:28');
/*!40000 ALTER TABLE `seat_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seats`
--

DROP TABLE IF EXISTS `seats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `seats` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `room_id` bigint(20) unsigned NOT NULL,
  `row` char(1) NOT NULL COMMENT 'A-Z',
  `column` tinyint(3) unsigned NOT NULL COMMENT '1-X',
  `type` enum('regular','vip','couple') NOT NULL DEFAULT 'regular',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `seats_room_id_row_column_unique` (`room_id`,`row`,`column`),
  CONSTRAINT `seats_room_id_foreign` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1461 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seats`
--

LOCK TABLES `seats` WRITE;
/*!40000 ALTER TABLE `seats` DISABLE KEYS */;
INSERT INTO `seats` VALUES (121,2,'A',1,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(122,2,'A',2,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(123,2,'A',3,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(124,2,'A',4,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(125,2,'A',5,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(126,2,'A',6,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(127,2,'A',7,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(128,2,'A',8,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(129,2,'A',9,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(130,2,'A',10,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(131,2,'A',11,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(132,2,'A',12,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(133,2,'A',13,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(134,2,'A',14,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(135,2,'A',15,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(136,2,'B',1,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(137,2,'B',2,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(138,2,'B',3,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(139,2,'B',4,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(140,2,'B',5,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(141,2,'B',6,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(142,2,'B',7,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(143,2,'B',8,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(144,2,'B',9,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(145,2,'B',10,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(146,2,'B',11,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(147,2,'B',12,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(148,2,'B',13,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(149,2,'B',14,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(150,2,'B',15,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(151,2,'C',1,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(152,2,'C',2,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(153,2,'C',3,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(154,2,'C',4,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(155,2,'C',5,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(156,2,'C',6,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(157,2,'C',7,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(158,2,'C',8,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(159,2,'C',9,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(160,2,'C',10,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(161,2,'C',11,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(162,2,'C',12,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(163,2,'C',13,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(164,2,'C',14,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(165,2,'C',15,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(166,2,'D',1,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(167,2,'D',2,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(168,2,'D',3,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(169,2,'D',4,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(170,2,'D',5,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(171,2,'D',6,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(172,2,'D',7,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(173,2,'D',8,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(174,2,'D',9,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(175,2,'D',10,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(176,2,'D',11,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(177,2,'D',12,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(178,2,'D',13,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(179,2,'D',14,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(180,2,'D',15,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(181,2,'E',1,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(182,2,'E',2,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(183,2,'E',3,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(184,2,'E',4,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(185,2,'E',5,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(186,2,'E',6,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(187,2,'E',7,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(188,2,'E',8,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(189,2,'E',9,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(190,2,'E',10,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(191,2,'E',11,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(192,2,'E',12,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(193,2,'E',13,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(194,2,'E',14,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(195,2,'E',15,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(196,2,'F',1,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(197,2,'F',2,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(198,2,'F',3,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(199,2,'F',4,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(200,2,'F',5,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(201,2,'F',6,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(202,2,'F',7,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(203,2,'F',8,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(204,2,'F',9,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(205,2,'F',10,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(206,2,'F',11,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(207,2,'F',12,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(208,2,'F',13,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(209,2,'F',14,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(210,2,'F',15,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(211,2,'G',1,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(212,2,'G',2,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(213,2,'G',3,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(214,2,'G',4,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(215,2,'G',5,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(216,2,'G',6,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(217,2,'G',7,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(218,2,'G',8,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(219,2,'G',9,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(220,2,'G',10,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(221,2,'G',11,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(222,2,'G',12,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(223,2,'G',13,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(224,2,'G',14,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(225,2,'G',15,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(226,2,'H',1,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(227,2,'H',2,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(228,2,'H',3,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(229,2,'H',4,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(230,2,'H',5,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(231,2,'H',6,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(232,2,'H',7,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(233,2,'H',8,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(234,2,'H',9,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(235,2,'H',10,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(236,2,'H',11,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(237,2,'H',12,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(238,2,'H',13,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(239,2,'H',14,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(240,2,'H',15,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(241,2,'I',1,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(242,2,'I',2,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(243,2,'I',3,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(244,2,'I',4,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(245,2,'I',5,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(246,2,'I',6,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(247,2,'I',7,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(248,2,'I',8,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(249,2,'I',9,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(250,2,'I',10,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(251,2,'I',11,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(252,2,'I',12,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(253,2,'I',13,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(254,2,'I',14,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(255,2,'I',15,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(256,2,'J',1,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(257,2,'J',2,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(258,2,'J',3,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(259,2,'J',4,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(260,2,'J',5,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(261,2,'J',6,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(262,2,'J',7,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(263,2,'J',8,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(264,2,'J',9,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(265,2,'J',10,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(266,2,'J',11,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(267,2,'J',12,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(268,2,'J',13,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(269,2,'J',14,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(270,2,'J',15,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(271,2,'K',1,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(272,2,'K',2,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(273,2,'K',3,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(274,2,'K',4,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(275,2,'K',5,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(276,2,'K',6,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(277,2,'K',7,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(278,2,'K',8,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(279,2,'K',9,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(280,2,'K',10,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(281,2,'K',11,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(282,2,'K',12,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(283,2,'K',13,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(284,2,'K',14,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(285,2,'K',15,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(286,2,'L',1,'couple','2026-03-21 20:23:17','2026-03-21 20:23:17'),(287,2,'L',2,'couple','2026-03-21 20:23:17','2026-03-21 20:23:17'),(288,2,'L',3,'couple','2026-03-21 20:23:17','2026-03-21 20:23:17'),(289,2,'L',4,'couple','2026-03-21 20:23:17','2026-03-21 20:23:17'),(290,2,'L',5,'couple','2026-03-21 20:23:17','2026-03-21 20:23:17'),(291,2,'L',6,'couple','2026-03-21 20:23:17','2026-03-21 20:23:17'),(292,2,'L',7,'couple','2026-03-21 20:23:17','2026-03-21 20:23:17'),(293,2,'L',8,'couple','2026-03-21 20:23:17','2026-03-21 20:23:17'),(294,2,'L',9,'couple','2026-03-21 20:23:17','2026-03-21 20:23:17'),(295,2,'L',10,'couple','2026-03-21 20:23:17','2026-03-21 20:23:17'),(296,2,'L',11,'couple','2026-03-21 20:23:17','2026-03-21 20:23:17'),(297,2,'L',12,'couple','2026-03-21 20:23:17','2026-03-21 20:23:17'),(298,2,'L',13,'couple','2026-03-21 20:23:17','2026-03-21 20:23:17'),(299,2,'L',14,'couple','2026-03-21 20:23:17','2026-03-21 20:23:17'),(300,2,'L',15,'couple','2026-03-21 20:23:17','2026-03-21 20:23:17'),(301,3,'A',1,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(302,3,'A',2,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(303,3,'A',3,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(304,3,'A',4,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(305,3,'A',5,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(306,3,'A',6,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(307,3,'A',7,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(308,3,'A',8,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(309,3,'A',9,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(310,3,'A',10,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(311,3,'B',1,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(312,3,'B',2,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(313,3,'B',3,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(314,3,'B',4,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(315,3,'B',5,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(316,3,'B',6,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(317,3,'B',7,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(318,3,'B',8,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(319,3,'B',9,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(320,3,'B',10,'regular','2026-03-21 20:23:17','2026-03-21 20:23:17'),(321,3,'C',1,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(322,3,'C',2,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(323,3,'C',3,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(324,3,'C',4,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(325,3,'C',5,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(326,3,'C',6,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(327,3,'C',7,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(328,3,'C',8,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(329,3,'C',9,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(330,3,'C',10,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(331,3,'D',1,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(332,3,'D',2,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(333,3,'D',3,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(334,3,'D',4,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(335,3,'D',5,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(336,3,'D',6,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(337,3,'D',7,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(338,3,'D',8,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(339,3,'D',9,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(340,3,'D',10,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(341,3,'E',1,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(342,3,'E',2,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(343,3,'E',3,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(344,3,'E',4,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(345,3,'E',5,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(346,3,'E',6,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(347,3,'E',7,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(348,3,'E',8,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(349,3,'E',9,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(350,3,'E',10,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(351,3,'F',1,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(352,3,'F',2,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(353,3,'F',3,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(354,3,'F',4,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(355,3,'F',5,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(356,3,'F',6,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(357,3,'F',7,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(358,3,'F',8,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(359,3,'F',9,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(360,3,'F',10,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(361,3,'G',1,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(362,3,'G',2,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(363,3,'G',3,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(364,3,'G',4,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(365,3,'G',5,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(366,3,'G',6,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(367,3,'G',7,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(368,3,'G',8,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(369,3,'G',9,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(370,3,'G',10,'vip','2026-03-21 20:23:17','2026-03-21 20:23:17'),(371,3,'H',1,'couple','2026-03-21 20:23:17','2026-03-21 20:23:17'),(372,3,'H',2,'couple','2026-03-21 20:23:17','2026-03-21 20:23:17'),(373,3,'H',3,'couple','2026-03-21 20:23:17','2026-03-21 20:23:17'),(374,3,'H',4,'couple','2026-03-21 20:23:17','2026-03-21 20:23:17'),(375,3,'H',5,'couple','2026-03-21 20:23:17','2026-03-21 20:23:17'),(376,3,'H',6,'couple','2026-03-21 20:23:17','2026-03-21 20:23:17'),(377,3,'H',7,'couple','2026-03-21 20:23:17','2026-03-21 20:23:17'),(378,3,'H',8,'couple','2026-03-21 20:23:17','2026-03-21 20:23:17'),(379,3,'H',9,'couple','2026-03-21 20:23:17','2026-03-21 20:23:17'),(380,3,'H',10,'couple','2026-03-21 20:23:17','2026-03-21 20:23:17'),(381,1,'A',1,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(382,1,'A',2,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(383,1,'A',3,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(384,1,'A',4,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(385,1,'A',5,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(386,1,'A',6,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(387,1,'A',7,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(388,1,'A',8,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(389,1,'A',9,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(390,1,'A',10,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(391,1,'B',1,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(392,1,'B',2,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(393,1,'B',3,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(394,1,'B',4,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(395,1,'B',5,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(396,1,'B',6,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(397,1,'B',7,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(398,1,'B',8,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(399,1,'B',9,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(400,1,'B',10,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(401,1,'C',1,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(402,1,'C',2,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(403,1,'C',3,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(404,1,'C',4,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(405,1,'C',5,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(406,1,'C',6,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(407,1,'C',7,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(408,1,'C',8,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(409,1,'C',9,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(410,1,'C',10,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(411,1,'D',1,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(412,1,'D',2,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(413,1,'D',3,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(414,1,'D',4,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(415,1,'D',5,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(416,1,'D',6,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(417,1,'D',7,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(418,1,'D',8,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(419,1,'D',9,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(420,1,'D',10,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(421,1,'E',1,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(422,1,'E',2,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(423,1,'E',3,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(424,1,'E',4,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(425,1,'E',5,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(426,1,'E',6,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(427,1,'E',7,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(428,1,'E',8,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(429,1,'E',9,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(430,1,'E',10,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(431,1,'F',1,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(432,1,'F',2,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(433,1,'F',3,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(434,1,'F',4,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(435,1,'F',5,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(436,1,'F',6,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(437,1,'F',7,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(438,1,'F',8,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(439,1,'F',9,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(440,1,'F',10,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(441,1,'G',1,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(442,1,'G',2,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(443,1,'G',3,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(444,1,'G',4,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(445,1,'G',5,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(446,1,'G',6,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(447,1,'G',7,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(448,1,'G',8,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(449,1,'G',9,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(450,1,'G',10,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(451,1,'H',1,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(452,1,'H',2,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(453,1,'H',3,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(454,1,'H',4,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(455,1,'H',5,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(456,1,'H',6,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(457,1,'H',7,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(458,1,'H',8,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(459,1,'H',9,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(460,1,'H',10,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(461,1,'I',1,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(462,1,'I',2,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(463,1,'I',3,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(464,1,'I',4,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(465,1,'I',5,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(466,1,'I',6,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(467,1,'I',7,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(468,1,'I',8,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(469,1,'I',9,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(470,1,'I',10,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(471,1,'J',1,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(472,1,'J',2,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(473,1,'J',3,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(474,1,'J',4,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(475,1,'J',5,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(476,1,'J',6,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(477,1,'J',7,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(478,1,'J',8,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(479,1,'J',9,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(480,1,'J',10,'regular','2026-03-21 20:25:09','2026-03-21 20:25:09'),(481,4,'A',1,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(482,4,'A',2,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(483,4,'A',3,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(484,4,'A',4,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(485,4,'A',5,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(486,4,'A',6,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(487,4,'A',7,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(488,4,'A',8,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(489,4,'A',9,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(490,4,'A',10,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(491,4,'B',1,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(492,4,'B',2,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(493,4,'B',3,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(494,4,'B',4,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(495,4,'B',5,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(496,4,'B',6,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(497,4,'B',7,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(498,4,'B',8,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(499,4,'B',9,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(500,4,'B',10,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(501,4,'C',1,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(502,4,'C',2,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(503,4,'C',3,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(504,4,'C',4,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(505,4,'C',5,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(506,4,'C',6,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(507,4,'C',7,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(508,4,'C',8,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(509,4,'C',9,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(510,4,'C',10,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(511,4,'D',1,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(512,4,'D',2,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(513,4,'D',3,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(514,4,'D',4,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(515,4,'D',5,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(516,4,'D',6,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(517,4,'D',7,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(518,4,'D',8,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(519,4,'D',9,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(520,4,'D',10,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(521,4,'E',1,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(522,4,'E',2,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(523,4,'E',3,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(524,4,'E',4,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(525,4,'E',5,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(526,4,'E',6,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(527,4,'E',7,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(528,4,'E',8,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(529,4,'E',9,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(530,4,'E',10,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(531,4,'F',1,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(532,4,'F',2,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(533,4,'F',3,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(534,4,'F',4,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(535,4,'F',5,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(536,4,'F',6,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(537,4,'F',7,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(538,4,'F',8,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(539,4,'F',9,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(540,4,'F',10,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(541,4,'G',1,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(542,4,'G',2,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(543,4,'G',3,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(544,4,'G',4,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(545,4,'G',5,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(546,4,'G',6,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(547,4,'G',7,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(548,4,'G',8,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(549,4,'G',9,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(550,4,'G',10,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(551,4,'H',1,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(552,4,'H',2,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(553,4,'H',3,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(554,4,'H',4,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(555,4,'H',5,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(556,4,'H',6,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(557,4,'H',7,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(558,4,'H',8,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(559,4,'H',9,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(560,4,'H',10,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(561,4,'I',1,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(562,4,'I',2,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(563,4,'I',3,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(564,4,'I',4,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(565,4,'I',5,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(566,4,'I',6,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(567,4,'I',7,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(568,4,'I',8,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(569,4,'I',9,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(570,4,'I',10,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(571,4,'J',1,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(572,4,'J',2,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(573,4,'J',3,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(574,4,'J',4,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(575,4,'J',5,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(576,4,'J',6,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(577,4,'J',7,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(578,4,'J',8,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(579,4,'J',9,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(580,4,'J',10,'regular','2026-03-21 22:47:13','2026-03-21 22:47:13'),(581,5,'A',1,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(582,5,'A',2,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(583,5,'A',3,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(584,5,'A',4,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(585,5,'A',5,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(586,5,'A',6,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(587,5,'A',7,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(588,5,'A',8,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(589,5,'A',9,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(590,5,'A',10,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(591,5,'B',1,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(592,5,'B',2,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(593,5,'B',3,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(594,5,'B',4,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(595,5,'B',5,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(596,5,'B',6,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(597,5,'B',7,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(598,5,'B',8,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(599,5,'B',9,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(600,5,'B',10,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(601,5,'C',1,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(602,5,'C',2,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(603,5,'C',3,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(604,5,'C',4,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(605,5,'C',5,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(606,5,'C',6,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(607,5,'C',7,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(608,5,'C',8,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(609,5,'C',9,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(610,5,'C',10,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(611,5,'D',1,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(612,5,'D',2,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(613,5,'D',3,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(614,5,'D',4,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(615,5,'D',5,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(616,5,'D',6,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(617,5,'D',7,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(618,5,'D',8,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(619,5,'D',9,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(620,5,'D',10,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(621,5,'E',1,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(622,5,'E',2,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(623,5,'E',3,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(624,5,'E',4,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(625,5,'E',5,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(626,5,'E',6,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(627,5,'E',7,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(628,5,'E',8,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(629,5,'E',9,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(630,5,'E',10,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(631,5,'F',1,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(632,5,'F',2,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(633,5,'F',3,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(634,5,'F',4,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(635,5,'F',5,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(636,5,'F',6,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(637,5,'F',7,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(638,5,'F',8,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(639,5,'F',9,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(640,5,'F',10,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(641,5,'G',1,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(642,5,'G',2,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(643,5,'G',3,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(644,5,'G',4,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(645,5,'G',5,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(646,5,'G',6,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(647,5,'G',7,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(648,5,'G',8,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(649,5,'G',9,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(650,5,'G',10,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(651,5,'H',1,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(652,5,'H',2,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(653,5,'H',3,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(654,5,'H',4,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(655,5,'H',5,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(656,5,'H',6,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(657,5,'H',7,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(658,5,'H',8,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(659,5,'H',9,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(660,5,'H',10,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(661,5,'I',1,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(662,5,'I',2,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(663,5,'I',3,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(664,5,'I',4,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(665,5,'I',5,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(666,5,'I',6,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(667,5,'I',7,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(668,5,'I',8,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(669,5,'I',9,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(670,5,'I',10,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(671,5,'J',1,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(672,5,'J',2,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(673,5,'J',3,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(674,5,'J',4,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(675,5,'J',5,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(676,5,'J',6,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(677,5,'J',7,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(678,5,'J',8,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(679,5,'J',9,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(680,5,'J',10,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(681,5,'K',1,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(682,5,'K',2,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(683,5,'K',3,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(684,5,'K',4,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(685,5,'K',5,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(686,5,'K',6,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(687,5,'K',7,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(688,5,'K',8,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(689,5,'K',9,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(690,5,'K',10,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(691,5,'L',1,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(692,5,'L',2,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(693,5,'L',3,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(694,5,'L',4,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(695,5,'L',5,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(696,5,'L',6,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(697,5,'L',7,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(698,5,'L',8,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(699,5,'L',9,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(700,5,'L',10,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(701,5,'M',1,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(702,5,'M',2,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(703,5,'M',3,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(704,5,'M',4,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(705,5,'M',5,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(706,5,'M',6,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(707,5,'M',7,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(708,5,'M',8,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(709,5,'M',9,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(710,5,'M',10,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(711,5,'N',1,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(712,5,'N',2,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(713,5,'N',3,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(714,5,'N',4,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(715,5,'N',5,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(716,5,'N',6,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(717,5,'N',7,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(718,5,'N',8,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(719,5,'N',9,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(720,5,'N',10,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(721,5,'O',1,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(722,5,'O',2,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(723,5,'O',3,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(724,5,'O',4,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(725,5,'O',5,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(726,5,'O',6,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(727,5,'O',7,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(728,5,'O',8,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(729,5,'O',9,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(730,5,'O',10,'regular','2026-03-22 01:54:29','2026-03-22 01:54:29'),(731,6,'A',1,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(732,6,'A',2,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(733,6,'A',3,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(734,6,'A',4,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(735,6,'A',5,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(736,6,'A',6,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(737,6,'A',7,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(738,6,'A',8,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(739,6,'B',1,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(740,6,'B',2,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(741,6,'B',3,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(742,6,'B',4,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(743,6,'B',5,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(744,6,'B',6,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(745,6,'B',7,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(746,6,'B',8,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(747,6,'C',1,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(748,6,'C',2,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(749,6,'C',3,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(750,6,'C',4,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(751,6,'C',5,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(752,6,'C',6,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(753,6,'C',7,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(754,6,'C',8,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(755,6,'D',1,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(756,6,'D',2,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(757,6,'D',3,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(758,6,'D',4,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(759,6,'D',5,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(760,6,'D',6,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(761,6,'D',7,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(762,6,'D',8,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(763,6,'E',1,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(764,6,'E',2,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(765,6,'E',3,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(766,6,'E',4,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(767,6,'E',5,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(768,6,'E',6,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(769,6,'E',7,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(770,6,'E',8,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(771,6,'F',1,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(772,6,'F',2,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(773,6,'F',3,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(774,6,'F',4,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(775,6,'F',5,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(776,6,'F',6,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(777,6,'F',7,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(778,6,'F',8,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(779,6,'G',1,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(780,6,'G',2,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(781,6,'G',3,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(782,6,'G',4,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(783,6,'G',5,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(784,6,'G',6,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(785,6,'G',7,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(786,6,'G',8,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(787,6,'H',1,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(788,6,'H',2,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(789,6,'H',3,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(790,6,'H',4,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(791,6,'H',5,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(792,6,'H',6,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(793,6,'H',7,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(794,6,'H',8,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(795,6,'I',1,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(796,6,'I',2,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(797,6,'I',3,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(798,6,'I',4,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(799,6,'I',5,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(800,6,'I',6,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(801,6,'I',7,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(802,6,'I',8,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(803,6,'J',1,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(804,6,'J',2,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(805,6,'J',3,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(806,6,'J',4,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(807,6,'J',5,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(808,6,'J',6,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(809,6,'J',7,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00'),(810,6,'J',8,'regular','2026-03-22 06:06:00','2026-03-22 06:06:00');
/*!40000 ALTER TABLE `seats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `showtimes`
--

DROP TABLE IF EXISTS `showtimes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `showtimes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `movie_id` bigint(20) unsigned NOT NULL,
  `room_id` bigint(20) unsigned NOT NULL,
  `start_time` datetime NOT NULL,
  `format` varchar(255) NOT NULL DEFAULT 'Phụ đề',
  `end_time` datetime NOT NULL COMMENT 'start_time + duration + 15 phút dọn phòng',
  `price_regular` decimal(10,0) NOT NULL COMMENT 'Giá vé thường (VNĐ)',
  `price_vip` decimal(10,0) NOT NULL COMMENT 'Giá vé VIP',
  `price_couple` decimal(10,0) NOT NULL COMMENT 'Giá ghế đôi',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `showtimes_movie_id_foreign` (`movie_id`),
  KEY `showtimes_room_id_start_time_end_time_index` (`room_id`,`start_time`,`end_time`),
  CONSTRAINT `showtimes_movie_id_foreign` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `showtimes_room_id_foreign` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `showtimes`
--

LOCK TABLES `showtimes` WRITE;
/*!40000 ALTER TABLE `showtimes` DISABLE KEYS */;
INSERT INTO `showtimes` VALUES (1,12,1,'2026-03-25 07:50:00','Phụ đề','2026-03-25 10:22:00',60000,80000,150000,'2026-03-21 20:55:14','2026-03-22 01:59:23'),(2,12,1,'2026-05-04 10:58:00','Phụ đề','2026-05-04 06:30:00',60000,80000,150000,'2026-03-21 20:58:34','2026-03-21 20:59:02'),(3,10,5,'2026-03-25 07:50:00','Thuyết minh','2026-03-25 09:33:00',60000,80000,150000,'2026-03-22 01:55:22','2026-03-22 03:42:07'),(4,10,5,'2026-03-25 20:17:00','Phụ đề','2026-03-25 22:00:00',60000,80000,150000,'2026-03-22 01:57:04','2026-03-22 02:28:51'),(5,10,3,'2026-03-25 08:35:00','Thuyết minh','2026-03-25 10:18:00',60000,80000,150000,'2026-03-22 02:35:54','2026-03-22 03:42:01'),(6,11,1,'2026-03-26 20:05:00','Lồng tiếng','2026-03-26 22:20:00',60000,80000,150000,'2026-03-22 06:05:08','2026-03-22 06:05:08'),(7,15,6,'2026-03-23 23:00:00','Phụ đề','2026-03-24 01:19:00',60000,80000,150000,'2026-03-22 06:09:24','2026-03-22 06:09:24'),(12,12,1,'2026-05-05 16:51:00','Phụ đề','2026-05-05 12:23:00',60000,80000,150000,NULL,NULL),(13,14,1,'2026-05-05 16:51:00','Phụ đề','2026-05-05 12:37:00',60000,80000,150000,NULL,NULL),(14,17,1,'2026-05-06 10:40:00','Phụ đề','2026-05-06 12:54:00',60000,80000,150000,NULL,NULL);
/*!40000 ALTER TABLE `showtimes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('admin','customer','staff') NOT NULL DEFAULT 'customer',
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Administrator','admin@cinema.com',NULL,'$2y$10$/jv.pazmtLxoJdVlQvk6/Oi6KcPQp6xSH0OZ.DhpfrEz8shLpwbxO','0901234567','admin',NULL,'2026-03-21 20:23:17','2026-03-21 20:23:17'),(2,'Staff Member','staff@cinema.com',NULL,'$2y$10$/QOU3zKDdPIQ7fNFTtUi/uWz.4SwTehXaMHxUR2VjB0H4.BxTSoey','0901234568','staff',NULL,'2026-03-21 20:23:17','2026-03-22 06:14:48'),(3,'Customer User','customer@cinema.com',NULL,'$2y$10$g9b623SBTAx8HDI9U1uG.eaZnt997ibJQ./aku9fUOsVIrTVUIJuC','0901234569','customer',NULL,'2026-03-21 20:23:17','2026-03-21 20:23:17'),(4,'Lê Hữu Lợi','huuloi1@gmail.com',NULL,'$2y$10$TXib9NVN38r.RNbtj7m/r.lQVeRIiYFGPfT711O3dSK46B0R/frJ6','0329110917','customer',NULL,'2026-03-21 21:00:27','2026-03-22 06:16:32'),(5,'Nguyễn Quang Diễn','huuloi2@gmail.com',NULL,'$2y$10$y0h23waZfsGDCkQLaHqmneU4MUvq6WIzQz1xmteUIo7Dg1PGFtiC2','0329110917','customer',NULL,'2026-03-21 21:12:34','2026-03-21 21:12:34'),(6,'Bùi Quang Diễn','quangdien1324@gmail.com',NULL,'$2b$10$hFvJXNdDZwnX08.cNcDuxOI8mJApDa3RBugPdBIgJY2cMe4HHkIMG','0855904652','customer',NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-07  0:39:10
