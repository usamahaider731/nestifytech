<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DynamicPagesSeeder extends Seeder
{
    /**
     * Seed the required dynamic pages (About Us, Privacy Policy, etc.)
     * These pages are managed via the admin panel at /admin/post/page
     * and rendered on the frontend at /page/{slug}
     */
    public function run(): void
    {
        $userId = DB::table('users')->value('id') ?? 1;

        $pages = [
            [
                'title'             => 'About Us',
                'sku'               => 'about-us',
                'short_description' => 'Learn about our story, mission, and the team behind NestifyTech.',
                'description'       => '<h2>Who We Are</h2>
<p>Welcome to <strong>NestifyTech</strong> — your trusted destination for premium electronics, smart gadgets, and cutting-edge technology products. Founded with a passion for innovation, we connect customers with the latest and greatest in consumer electronics.</p>

<h2>Our Mission</h2>
<p>Our mission is simple: to make world-class technology accessible to everyone. We curate every product with care, ensuring quality, authenticity, and competitive pricing. Whether you\'re a tech enthusiast, a professional, or buying a gift, NestifyTech has you covered.</p>

<h2>Why Choose Us?</h2>
<ul>
  <li><strong>100% Authentic Products</strong> — Every item is sourced directly from authorized manufacturers and distributors.</li>
  <li><strong>Fast & Reliable Shipping</strong> — We partner with leading courier services to ensure timely delivery.</li>
  <li><strong>Expert Customer Support</strong> — Our team is available 24/7 to help you with any questions or concerns.</li>
  <li><strong>Secure Payments</strong> — We use industry-leading encryption to protect your transactions.</li>
  <li><strong>Easy Returns</strong> — Not satisfied? Our hassle-free 30-day return policy has you covered.</li>
</ul>

<h2>Our Vision</h2>
<p>We envision a world where innovative technology empowers lives — from the home to the office and everywhere in between. At NestifyTech, we are committed to growing alongside the communities we serve.</p>',
                'status'            => 'publish',
                'seo_title'         => 'About Us | NestifyTech',
                'seo_description'   => 'Learn about NestifyTech — our story, mission, and commitment to delivering premium electronics and technology products.',
                'layout_type'       => 'sidebar_right',
                'container_width'   => 'container',
                'header_style'      => 'hero_gradient',
                'show_breadcrumbs'  => '1',
                'sticky_sidebar'    => '1',
                'sidebar_widgets'   => json_encode(['toc', 'recent_blogs', 'contact_card']),
                'footer_widget'     => 'cta_banner',
                'footer_cta_title'  => 'Ready to Experience Premium Technology?',
                'footer_cta_desc'   => 'Join thousands of satisfied customers who trust NestifyTech for authentic, high-performance electronics and smart devices.',
                'footer_cta_btn_text' => 'Explore Products',
                'footer_cta_btn_url' => '/',
            ],
            [
                'title'             => 'Privacy Policy',
                'sku'               => 'privacy-policy',
                'short_description' => 'How we collect, use, and protect your personal information.',
                'description'       => '<p><em>Last updated: ' . now()->format('F d, Y') . '</em></p>

<h2>1. Information We Collect</h2>
<p>We collect information you provide directly to us, such as when you create an account, place an order, or contact our support team. This may include your name, email address, shipping address, phone number, and payment information.</p>

<h2>2. How We Use Your Information</h2>
<p>We use the information we collect to:</p>
<ul>
  <li>Process and fulfill your orders</li>
  <li>Send transactional and promotional communications</li>
  <li>Improve our website and services</li>
  <li>Comply with legal obligations</li>
</ul>

<h2>3. Sharing of Information</h2>
<p>We do not sell or rent your personal information to third parties. We may share your data with trusted service providers who assist us in operating our website and conducting our business, subject to confidentiality agreements.</p>

<h2>4. Cookies</h2>
<p>We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookies through your browser settings.</p>

<h2>5. Data Security</h2>
<p>We implement industry-standard security measures including SSL encryption to protect your personal data from unauthorized access, alteration, disclosure, or destruction.</p>

<h2>6. Your Rights</h2>
<p>You have the right to access, correct, or delete your personal data at any time. Please contact us at <strong>privacy@nestifytech.com</strong> to exercise these rights.</p>

<h2>7. Contact Us</h2>
<p>If you have any questions about this Privacy Policy, please contact us at <strong>privacy@nestifytech.com</strong>.</p>',
                'status'            => 'publish',
                'seo_title'         => 'Privacy Policy | NestifyTech',
                'seo_description'   => 'Read NestifyTech\'s privacy policy to understand how we collect, use, and protect your personal information.',
                'layout_type'       => 'sidebar_left',
                'container_width'   => 'container',
                'header_style'      => 'hero_gradient',
                'show_breadcrumbs'  => '1',
                'sticky_sidebar'    => '1',
                'sidebar_widgets'   => json_encode(['toc', 'related_pages', 'contact_card']),
                'footer_widget'     => 'cta_banner',
                'footer_cta_title'  => 'Questions Regarding Your Data & Privacy?',
                'footer_cta_desc'   => 'Our data protection officer and compliance team are available to address any inquiries or rights requests.',
                'footer_cta_btn_text' => 'Contact Privacy Team',
                'footer_cta_btn_url' => '/page/contact-us',
            ],
            [
                'title'             => 'Terms & Conditions',
                'sku'               => 'terms-and-conditions',
                'short_description' => 'Please read these terms carefully before using our services.',
                'description'       => '<p><em>Last updated: ' . now()->format('F d, Y') . '</em></p>

<h2>1. Acceptance of Terms</h2>
<p>By accessing or using the NestifyTech website, you agree to be bound by these Terms and Conditions. If you do not agree, please discontinue use of our services.</p>

<h2>2. Products & Pricing</h2>
<p>All prices are listed in USD unless otherwise indicated. We reserve the right to change prices at any time without prior notice. Product availability is subject to change.</p>

<h2>3. Orders & Payment</h2>
<p>By placing an order, you represent that you are of legal age and authorized to use the payment method provided. All orders are subject to acceptance and availability.</p>

<h2>4. Shipping & Delivery</h2>
<p>Estimated delivery times are provided in good faith but are not guaranteed. NestifyTech is not responsible for delays caused by shipping carriers, customs, or circumstances beyond our control.</p>

<h2>5. Returns & Refunds</h2>
<p>Our return policy allows returns within 30 days of delivery, provided items are in original condition. See our full Return Policy for details.</p>

<h2>6. Intellectual Property</h2>
<p>All content on this website, including text, graphics, logos, and images, is the property of NestifyTech and may not be reproduced without written permission.</p>

<h2>7. Limitation of Liability</h2>
<p>NestifyTech shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services.</p>

<h2>8. Governing Law</h2>
<p>These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which NestifyTech operates.</p>

<h2>9. Changes to Terms</h2>
<p>We reserve the right to update these Terms at any time. Continued use of the site constitutes acceptance of the updated Terms.</p>',
                'status'            => 'publish',
                'seo_title'         => 'Terms & Conditions | NestifyTech',
                'seo_description'   => 'Read the Terms and Conditions for using NestifyTech, including policies on orders, payments, shipping, and returns.',
                'layout_type'       => 'sidebar_left',
                'container_width'   => 'container',
                'header_style'      => 'hero_gradient',
                'show_breadcrumbs'  => '1',
                'sticky_sidebar'    => '1',
                'sidebar_widgets'   => json_encode(['toc', 'related_pages', 'contact_card']),
                'footer_widget'     => 'cta_banner',
                'footer_cta_title'  => 'Need Clarification on Any Terms?',
                'footer_cta_desc'   => 'Our legal and support specialists can help answer any questions about our terms of service.',
                'footer_cta_btn_text' => 'Get Support',
                'footer_cta_btn_url' => '/page/contact-us',
            ],
            [
                'title'             => 'Return & Refund Policy',
                'sku'               => 'return-refund-policy',
                'short_description' => 'Our hassle-free 30-day return and refund policy explained.',
                'description'       => '<h2>Our 30-Day Return Policy</h2>
<p>Your satisfaction is our priority. If you are not completely satisfied with your purchase, you may return it within <strong>30 days</strong> of the delivery date for a full refund or exchange.</p>

<h2>Eligibility for Returns</h2>
<ul>
  <li>Items must be in their original, unused condition</li>
  <li>Items must be in the original packaging with all accessories included</li>
  <li>Proof of purchase (order number or receipt) is required</li>
  <li>Defective or damaged items qualify for free return shipping</li>
</ul>

<h2>Non-Returnable Items</h2>
<ul>
  <li>Software that has been activated or downloaded</li>
  <li>Items marked as final sale or clearance</li>
  <li>Consumables that have been opened</li>
</ul>

<h2>How to Initiate a Return</h2>
<ol>
  <li>Contact our support team at <strong>returns@nestifytech.com</strong> with your order number</li>
  <li>Our team will provide a Return Merchandise Authorization (RMA) number</li>
  <li>Pack the item securely and include your RMA number</li>
  <li>Ship the item to the address provided by our support team</li>
</ol>

<h2>Refund Processing</h2>
<p>Once we receive and inspect the returned item (typically within 24–48 hours), your refund will be processed to your original payment method within <strong>3–7 business days</strong>.</p>',
                'status'            => 'publish',
                'seo_title'         => 'Return & Refund Policy | NestifyTech',
                'seo_description'   => 'Learn about NestifyTech\'s 30-day hassle-free return and refund policy for all purchases.',
                'layout_type'       => 'sidebar_right',
                'container_width'   => 'container',
                'header_style'      => 'hero_gradient',
                'show_breadcrumbs'  => '1',
                'sticky_sidebar'    => '1',
                'sidebar_widgets'   => json_encode(['toc', 'contact_card', 'related_pages']),
                'footer_widget'     => 'faq_accordion',
                'footer_cta_title'  => 'Common Questions About Returns & Refunds',
                'footer_cta_desc'   => 'Find immediate answers below or start a return by messaging our dedicated returns department.',
            ],
            [
                'title'             => 'Shipping Policy',
                'sku'               => 'shipping-policy',
                'short_description' => 'Everything you need to know about our delivery and shipping services.',
                'description'       => '<h2>Shipping Options</h2>
<table style="width:100%;border-collapse:collapse;">
  <thead>
    <tr style="background:#f3f4f6;">
      <th style="padding:10px;border:1px solid #e5e7eb;text-align:left;">Service</th>
      <th style="padding:10px;border:1px solid #e5e7eb;text-align:left;">Delivery Time</th>
      <th style="padding:10px;border:1px solid #e5e7eb;text-align:left;">Cost</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:10px;border:1px solid #e5e7eb;">Standard Shipping</td>
      <td style="padding:10px;border:1px solid #e5e7eb;">3–5 Business Days</td>
      <td style="padding:10px;border:1px solid #e5e7eb;">Free on orders over $50</td>
    </tr>
    <tr style="background:#f9fafb;">
      <td style="padding:10px;border:1px solid #e5e7eb;">Express Shipping</td>
      <td style="padding:10px;border:1px solid #e5e7eb;">1–2 Business Days</td>
      <td style="padding:10px;border:1px solid #e5e7eb;">$9.99</td>
    </tr>
    <tr>
      <td style="padding:10px;border:1px solid #e5e7eb;">Overnight Shipping</td>
      <td style="padding:10px;border:1px solid #e5e7eb;">Next Business Day</td>
      <td style="padding:10px;border:1px solid #e5e7eb;">$19.99</td>
    </tr>
    <tr style="background:#f9fafb;">
      <td style="padding:10px;border:1px solid #e5e7eb;">International Shipping</td>
      <td style="padding:10px;border:1px solid #e5e7eb;">7–14 Business Days</td>
      <td style="padding:10px;border:1px solid #e5e7eb;">Calculated at checkout</td>
    </tr>
  </tbody>
</table>

<h2>Order Processing</h2>
<p>Orders are processed within <strong>1–2 business days</strong> of being placed (excluding weekends and public holidays). You will receive a confirmation email with tracking details once your order has been dispatched.</p>

<h2>Order Tracking</h2>
<p>Once your order ships, you will receive an email with a tracking number. You can track your order in real time from your <strong>Account Dashboard</strong> or via the carrier\'s website.</p>

<h2>Shipping Restrictions</h2>
<p>We currently ship to most countries worldwide. Some products may have shipping restrictions due to local regulations. If your country is not supported at checkout, please contact our support team.</p>

<h2>Damaged or Lost Packages</h2>
<p>If your package arrives damaged or is lost in transit, please contact us within <strong>48 hours</strong> of the expected delivery date. We will work with the carrier to resolve the issue promptly.</p>',
                'status'            => 'publish',
                'seo_title'         => 'Shipping Policy | NestifyTech',
                'seo_description'   => 'Learn about NestifyTech\'s shipping options, delivery times, order tracking, and international shipping information.',
                'layout_type'       => 'sidebar_right',
                'container_width'   => 'container',
                'header_style'      => 'hero_gradient',
                'show_breadcrumbs'  => '1',
                'sticky_sidebar'    => '1',
                'sidebar_widgets'   => json_encode(['toc', 'contact_card', 'related_pages']),
                'footer_widget'     => 'faq_accordion',
                'footer_cta_title'  => 'Delivery Questions & Order Tracking',
                'footer_cta_desc'   => 'Need real-time carrier tracking assistance? Our fulfillment specialists are standing by.',
            ],
            [
                'title'             => 'Contact Us',
                'sku'               => 'contact-us',
                'short_description' => 'Get in touch with our support team — we are here to help 24/7.',
                'description'       => '<h2>We\'d Love to Hear From You</h2>
<p>Whether you have a question about an order, need product advice, or want to partner with us — our team is ready to assist you around the clock.</p>

<h2>Customer Support</h2>
<ul>
  <li><strong>Email:</strong> support@nestifytech.com</li>
  <li><strong>Phone:</strong> +1 (800) 123-4567</li>
  <li><strong>Live Chat:</strong> Available on our website 24/7</li>
  <li><strong>Support Hours:</strong> Monday – Sunday, 9:00 AM – 9:00 PM (EST)</li>
</ul>

<h2>Order Inquiries</h2>
<p>For questions about an existing order — tracking, modifications, cancellations, or returns — please have your <strong>order number</strong> ready when you contact us for faster service.</p>

<h2>Business & Partnership Inquiries</h2>
<p>Interested in partnering with NestifyTech, becoming a reseller, or exploring wholesale opportunities? Reach out to our partnerships team at <strong>partners@nestifytech.com</strong>.</p>

<h2>Our Head Office</h2>
<p>
  <strong>NestifyTech Inc.</strong><br>
  123 Tech Boulevard, Suite 400<br>
  San Francisco, CA 94105<br>
  United States
</p>',
                'status'            => 'publish',
                'seo_title'         => 'Contact Us | NestifyTech',
                'seo_description'   => 'Contact NestifyTech\'s customer support team via email, phone, or live chat. We are available 24/7 to help you.',
                'layout_type'       => 'sidebar_right',
                'container_width'   => 'container',
                'header_style'      => 'hero_gradient',
                'show_breadcrumbs'  => '1',
                'sticky_sidebar'    => '1',
                'sidebar_widgets'   => json_encode(['contact_card', 'related_pages', 'newsletter']),
                'footer_widget'     => 'contact_grid',
                'footer_cta_title'  => 'Official Customer Care Center',
                'footer_cta_desc'   => 'Reach out anytime through your preferred contact method.',
            ],
            [
                'title'             => 'Cookie Policy',
                'sku'               => 'cookie-policy',
                'short_description' => 'How we use cookies to enhance your experience on our website.',
                'description'       => '<p><em>Last updated: ' . now()->format('F d, Y') . '</em></p>

<h2>What Are Cookies?</h2>
<p>Cookies are small text files stored on your device when you visit a website. They help us remember your preferences, understand how you use our site, and improve your overall experience.</p>

<h2>Types of Cookies We Use</h2>
<ul>
  <li><strong>Essential Cookies:</strong> Required for the website to function properly (e.g., shopping cart, login sessions).</li>
  <li><strong>Performance Cookies:</strong> Help us understand how visitors interact with our site through analytics.</li>
  <li><strong>Functionality Cookies:</strong> Remember your preferences such as language and currency.</li>
  <li><strong>Marketing Cookies:</strong> Used to show you relevant advertisements based on your browsing behavior.</li>
</ul>

<h2>Managing Cookies</h2>
<p>Most browsers allow you to control cookies through their settings. You can choose to block or delete cookies, but doing so may affect the functionality of certain features on our website.</p>

<h2>Third-Party Cookies</h2>
<p>We may use third-party services such as Google Analytics, Facebook Pixel, and payment processors that also set their own cookies. These are governed by their respective privacy policies.</p>

<h2>Contact Us</h2>
<p>For questions about our cookie use, please contact us at <strong>privacy@nestifytech.com</strong>.</p>',
                'status'            => 'publish',
                'seo_title'         => 'Cookie Policy | NestifyTech',
                'seo_description'   => 'Learn how NestifyTech uses cookies to enhance your browsing experience and how you can manage your cookie preferences.',
                'layout_type'       => 'narrow_center',
                'container_width'   => 'narrow',
                'header_style'      => 'hero_gradient',
                'show_breadcrumbs'  => '1',
                'sticky_sidebar'    => '1',
                'sidebar_widgets'   => json_encode(['toc', 'related_pages']),
                'footer_widget'     => 'cta_banner',
                'footer_cta_title'  => 'Need Assistance With Cookie Preferences?',
                'footer_cta_desc'   => 'Reach out to our privacy compliance desk for questions about our cookie management policy.',
                'footer_cta_btn_text' => 'Contact Us',
                'footer_cta_btn_url' => '/page/contact-us',
            ],
        ];

        $metaKeys = [
            'short_description',
            'seo_title',
            'seo_description',
            'layout_type',
            'container_width',
            'header_style',
            'show_breadcrumbs',
            'sticky_sidebar',
            'sidebar_widgets',
            'footer_widget',
            'footer_cta_title',
            'footer_cta_desc',
            'footer_cta_btn_text',
            'footer_cta_btn_url',
        ];

        foreach ($pages as $page) {
            $existing = DB::table('posts')->where('sku', $page['sku'])->where('type', 'page')->first();

            if ($existing) {
                $postId = $existing->id;
                $this->command->line("  <comment>Updating layout & meta for existing:</comment> {$page['title']}");
            } else {
                $postId = DB::table('posts')->insertGetId([
                    'user_id'     => $userId,
                    'title'       => $page['title'],
                    'sku'         => $page['sku'],
                    'description' => $page['description'],
                    'status'      => $page['status'],
                    'type'        => 'page',
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
                $this->command->line("  <info>Created:</info> {$page['title']} → /page/{$page['sku']}");
            }

            // Sync all meta keys
            foreach ($metaKeys as $key) {
                if (isset($page[$key]) && $page[$key] !== '') {
                    DB::table('post_meta')->updateOrInsert(
                        ['post_id' => $postId, 'key' => $key],
                        ['value' => $page[$key]]
                    );
                }
            }

            // Sync media table image
            $imageFilename = $page['sku'] . '-banner.png';
            if ($page['sku'] === 'terms-and-conditions') $imageFilename = 'terms-and-conditions-banner.png';
            if ($page['sku'] === 'return-refund-policy') $imageFilename = 'return-refund-policy-banner.png';

            DB::table('media')->updateOrInsert(
                ['parent_id' => $postId, 'type' => 'post'],
                [
                    'filename'   => $imageFilename,
                    'name'       => $page['title'] . ' Banner',
                    'updated_at' => now(),
                ]
            );
        }

        $this->command->info('✓ Dynamic pages & layout settings seeded successfully.');
    }
}
