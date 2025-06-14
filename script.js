document.addEventListener('DOMContentLoaded', () => {
    // --- KONFIGURASI ---
    // Kredensial Supabase Anda sudah terisi.
    const SUPABASE_URL = 'https://fbuwyproxqmkuwncyxmf.supabase.co'; 
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZidXd5cHJveHFta3V3bmN5eG1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODc4MjEyNSwiZXhwIjoyMDY0MzU4MTI1fQ.3FMS5eJchIRpgS7CcdL7MpsMXWEh_8SyQXxOobUGzYU';
    
    // --- INISIALISASI APLIKASI ---
    function initApp() {
        // Cek jika kredensial belum diisi (sebagai pengaman tambahan).
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
             document.body.innerHTML = `<div style="font-family: sans-serif; background-color: #ffcccc; color: #a80000; text-align: center; padding: 40px; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;"><h1 style="font-size: 2em; margin-bottom: 20px;">Kesalahan Konfigurasi</h1><p style="font-size: 1.2em;">Kredensial Supabase belum diisi di file script.js.</p></div>`;
            return; 
        }

        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Inisialisasi library eksternal
        feather.replace();
        AOS.init({ duration: 800, once: true, offset: 50 });

        // Setup UI dasar
        document.getElementById('current-year').textContent = new Date().getFullYear();
        const mobileMenu = document.getElementById('mobile-menu');
        document.getElementById('mobile-menu-button').addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
        });
        
        // --- MEMUAT SEMUA DATA DINAMIS ---
        loadCompanyProfile(supabaseClient); // PERBAIKAN: Memanggil fungsi baru
        loadServices(supabaseClient);
        incrementAndShowVisitorCount(supabaseClient);
        loadInsurancePartners(supabaseClient);
        loadGallery(supabaseClient);
        loadTestimonials(supabaseClient);

        // --- MENGATUR EVENT LISTENERS ---
        setupTestimonialForm(supabaseClient);
        setupWhatsAppForm(supabaseClient);
        setupShareLocation();
    }

    // --- DEKLARASI FUNGSI-FUNGSI ---

    // PERBAIKAN: Fungsi baru untuk memuat profil usaha
    async function loadCompanyProfile(supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('company_profile')
                .select('*')
                .eq('id', 1)
                .single();

            if (error) throw error;
            if (!data) return;

            // Simpan nomor WA ke variabel global untuk digunakan di form
            window.WORKSHOP_WA_NUMBER = data.whatsapp_number;

            // Update semua elemen dengan ID yang sesuai
            document.getElementById('header-logo').innerHTML = `${data.company_name}<span class="primary-blue">Automobile</span>`;
            document.getElementById('profile-company-name-hero').textContent = data.company_name.toUpperCase();
            document.getElementById('profile-tagline').textContent = data.tagline;
            document.getElementById('profile-company-name-about').textContent = `Tentang ${data.company_name}`;
            document.getElementById('profile-about-us').textContent = data.about_us;
            document.getElementById('profile-address-map').textContent = data.address;
            document.getElementById('map-container').innerHTML = `<iframe src="${data.map_embed_url}" width="100%" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
            document.getElementById('footer-logo').textContent = data.company_name.toUpperCase();
            document.getElementById('footer-address').textContent = data.address;
            document.getElementById('footer-phone').textContent = data.phone_number;
            document.getElementById('footer-email').textContent = data.email;
            document.getElementById('footer-weekdays').textContent = data.operating_hours_weekdays;
            document.getElementById('footer-weekend').textContent = data.operating_hours_weekend;
            document.getElementById('footer-company-name').textContent = data.company_name;

            // Render ulang ikon setelah konten footer diubah
            feather.replace();

        } catch (error) {
            console.error("Gagal memuat profil usaha:", error.message);
        }
    }

    async function loadServices(supabaseClient) {
        const container = document.getElementById('services-container');
        if(!container) return;
        container.innerHTML = '<p class="col-span-full text-center">Memuat layanan...</p>';
        try {
            const { data, error } = await supabaseClient.from('services').select('*').order('created_at');
            if (error) throw error;
            container.innerHTML = '';
            if (data.length > 0) {
                data.forEach(service => {
                    container.innerHTML += `
                        <div class="bg-white p-8 rounded-lg service-card text-center">
                            <div class="bg-gradient-to-br from-blue-500 to-blue-600 inline-flex p-4 rounded-full text-white mb-4 shadow-lg">
                                <i data-feather="${service.icon_name || 'settings'}" class="h-8 w-8"></i>
                            </div>
                            <h3 class="text-xl font-bold accent-dark mb-2">${service.name}</h3>
                            <p class="text-gray-600">${service.description}</p>
                        </div>
                    `;
                });
                feather.replace();
            } else {
                container.innerHTML = '<p class="col-span-full text-center">Belum ada layanan yang tersedia.</p>';
            }
        } catch (error) {
            console.error('Error loading services:', error.message);
            container.innerHTML = '<p class="col-span-full text-center text-red-500">Gagal memuat layanan.</p>';
        }
    }
    
    async function incrementAndShowVisitorCount(supabaseClient) {
        const visitorCountEl = document.getElementById('visitor-count');
        try {
            const { data, error } = await supabaseClient.rpc('increment_visitor_count');
            if (error) throw error;
            visitorCountEl.textContent = data;
        } catch (error) {
            console.error('Error fetching visitor count:', error.message);
            visitorCountEl.textContent = 'N/A';
        }
    }

    async function loadInsurancePartners(supabaseClient) {
        const listEl = document.getElementById('insurance-list');
        const countEl = document.getElementById('insurance-count');
        if(!listEl) return;
        listEl.innerHTML = '<p class="col-span-full text-center">Memuat rekanan...</p>';
        try {
            const { data, error, count } = await supabaseClient.from('insurance_partners').select('*', { count: 'exact' });
            if(error) throw error;
            if(countEl) countEl.textContent = `${count}+`;
            listEl.innerHTML = '';
            if(data.length > 0) data.forEach(partner => listEl.innerHTML += `<div class="flex justify-center items-center transform transition-transform duration-300 hover:scale-110"><img src="${partner.logo_url}" alt="${partner.name}" class="h-12 md:h-16 transition-all duration-300" onerror="this.style.display='none'"></div>`);
            else listEl.innerHTML = '<p class="col-span-full text-center">Belum ada rekanan asuransi.</p>';
        } catch(error) {
            console.error('Error loading insurance partners:', error.message);
            listEl.innerHTML = '<p class="col-span-full text-center text-red-500">Gagal memuat rekanan asuransi.</p>';
        }
    }

    async function loadGallery(supabaseClient) {
        const galleryContainer = document.getElementById('gallery-container');
        if(!galleryContainer) return;
        galleryContainer.innerHTML = '<p class="col-span-full text-center">Memuat galeri...</p>';
        try {
            const { data, error } = await supabaseClient.from('gallery_images').select('*').order('created_at', { ascending: false }).limit(6);
            if (error) throw error;
            galleryContainer.innerHTML = '';
            if (data.length > 0) {
                data.forEach(file => {
                    galleryContainer.innerHTML += `
                        <div class="w-full h-64 bg-gray-200 rounded-lg overflow-hidden group shadow-lg">
                            <img src="${file.image_url}" alt="${file.title || 'Foto Galeri'}" class="w-full h-full object-cover transition-transform duration-500 transform group-hover:scale-110" onerror="this.onerror=null;this.src='https://placehold.co/400x300/CCCCCC/FFFFFF?text=Image+Not+Found';">
                        </div>`;
                });
            } else {
                galleryContainer.innerHTML = '<p class="col-span-full text-center">Galeri masih kosong.</p>';
            }
        } catch (error) {
            console.error('Error loading gallery:', error.message);
            galleryContainer.innerHTML = '<p class="col-span-full text-center text-red-500">Gagal memuat galeri.</p>';
        }
    }

    async function loadTestimonials(supabaseClient) {
        const testimonialList = document.getElementById('testimonial-list');
        if(!testimonialList) return;
        testimonialList.innerHTML = '<p class="col-span-full text-center">Memuat testimoni...</p>';
        try {
            const { data, error } = await supabaseClient.from('testimonials').select('*').order('created_at', { ascending: false }).limit(6);
            if (error) throw error;
            testimonialList.innerHTML = '';
            if (data.length > 0) {
                data.forEach(testimonial => {
                    const stars = '★'.repeat(testimonial.rating) + '☆'.repeat(5 - testimonial.rating);
                    testimonialList.innerHTML += `
                        <div class="bg-white p-6 rounded-lg testimonial-card">
                            <div class="flex items-center mb-4">
                                <div class="w-12 h-12 rounded-full bg-primary-blue text-white flex items-center justify-center font-bold text-xl mr-4 flex-shrink-0">
                                    ${testimonial.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 class="font-bold accent-dark">${testimonial.name}</h4>
                                    <div class="text-yellow-400 text-lg">${stars}</div>
                                </div>
                            </div>
                            <p class="text-gray-600 italic">"${testimonial.message}"</p>
                        </div>`;
                });
            } else {
                 testimonialList.innerHTML = '<p class="col-span-full text-center">Jadilah yang pertama memberikan testimoni!</p>';
            }
        } catch (error) {
             console.error('Error loading testimonials:', error.message);
             testimonialList.innerHTML = '<p class="col-span-full text-center text-red-500">Gagal memuat testimoni.</p>';
        }
    }
    
    function setupTestimonialForm(supabaseClient) {
        const showBtn = document.getElementById('show-testimonial-form-btn');
        const formContainer = document.getElementById('testimonial-form-container');
        if(!showBtn || !formContainer) return;

        const form = document.getElementById('testimonial-form');
        const stars = document.querySelectorAll('#star-rating span');
        const ratingValueInput = document.getElementById('rating-value');
        const submitBtn = document.getElementById('submit-testimonial-btn');

        showBtn.addEventListener('click', () => {
            formContainer.classList.remove('hidden');
            formContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            showBtn.classList.add('hidden');
        });

        stars.forEach(star => {
            star.addEventListener('click', () => {
                const value = star.getAttribute('data-value');
                ratingValueInput.value = value;
                stars.forEach(s => {
                    s.classList.toggle('text-yellow-400', s.getAttribute('data-value') <= value);
                    s.classList.toggle('text-gray-300', s.getAttribute('data-value') > value);
                });
            });
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!ratingValueInput.value) {
                alert("Harap berikan rating bintang terlebih dahulu.");
                return;
            }
            setLoading(submitBtn, true);
            const { error } = await supabaseClient.from('testimonials').insert([{ name: form.nama.value, rating: form.rating.value, message: form.pesan.value }]);
            setLoading(submitBtn, false);
            if (error) {
                alert('Maaf, terjadi kesalahan saat mengirim testimoni.');
            } else {
                alert('Terima kasih! Testimoni Anda telah diterima.');
                form.reset();
                ratingValueInput.value = '';
                stars.forEach(s => s.classList.replace('text-yellow-400', 'text-gray-300'));
                formContainer.classList.add('hidden');
                showBtn.classList.remove('hidden');
                loadTestimonials(supabaseClient);
            }
        });
    }

    function setupWhatsAppForm(supabaseClient) {
        const waForm = document.getElementById('wa-form');
        if(!waForm) return;
        const sendBtn = document.getElementById('send-wa-btn');
        waForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            setLoading(sendBtn, true);
            const name = waForm['wa-nama'].value;
            const phone = waForm['wa-no'].value;
            const message = waForm['wa-pesan'].value;
            try {
                await supabaseClient.from('contacts').insert([{ name, phone, message }]);
            } catch(error) { console.error('Error saving contact:', error.message); }
            
            const waMessage = `Halo Unity Automobile,\n\nNama: *${name}*\nNo. WA: *${phone}*\n\nPesan:\n${message}`;
            const encodedMessage = encodeURIComponent(waMessage);
            window.open(`https://api.whatsapp.com/send?phone=${window.WORKSHOP_WA_NUMBER || '628123456789'}&text=${encodedMessage}`, '_blank');
            
            setLoading(sendBtn, false);
            waForm.reset();
        });
    }

    function setupShareLocation() {
        const shareBtn = document.getElementById('share-location-btn');
        if(!shareBtn) return;
        shareBtn.addEventListener('click', () => {
            const locationUrl = 'https://maps.app.goo.gl/wQhCfhT1E3gXJqYV6'; 
            const shareData = { title: 'Lokasi Unity Automobile', text: 'Kunjungi Unity Automobile di Medan.', url: locationUrl };
            if (navigator.share) navigator.share(shareData).catch(console.error);
            else navigator.clipboard.writeText(locationUrl).then(() => alert('Lokasi disalin!'));
        });
    }
    
    function setLoading(button, isLoading) {
        button.classList.toggle('btn-loading', isLoading);
        button.disabled = isLoading;
    }

    // --- MULAI APLIKASI ---
    initApp();
});
