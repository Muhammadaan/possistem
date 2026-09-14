<?php

namespace Tests\Feature\Api;

use App\Models\Branch;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class MobileSalesTest extends TestCase
{
    use RefreshDatabase;

    private Branch $branch;

    private Branch $otherBranch;

    private User $kasir;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create(['code' => 'TST-01', 'name' => 'Toko Test']);
        $this->otherBranch = Branch::create(['code' => 'TST-02', 'name' => 'Toko Lain']);

        Supplier::create(['name' => 'Supplier Test']);

        $this->kasir = User::factory()->create([
            'role' => User::ROLE_CASHIER,
            'branch_id' => $this->branch->id,
        ]);

        $this->product = Product::create([
            'branch_id' => $this->branch->id,
            'sku' => 'BRG-001',
            'name' => 'Barang Test',
            'unit' => 'pcs',
            'selling_price' => 15000,
            'average_cost' => 10000,
            'stock' => 20,
            'is_active' => true,
        ]);
    }

    private function token(): string
    {
        return $this->kasir->createToken('test', ['mobile'])->plainTextToken;
    }

    public function test_kasir_can_login_and_get_token(): void
    {
        $response = $this->postJson('/api/v1/login', [
            'email' => $this->kasir->email,
            'password' => 'password',
            'device_name' => 'android-test',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.role', 'CASHIER')
            ->assertJsonPath('branch.code', 'TST-01')
            ->assertJsonStructure(['token', 'user', 'branch']);
    }

    public function test_login_rejects_wrong_password(): void
    {
        $this->postJson('/api/v1/login', [
            'email' => $this->kasir->email,
            'password' => 'salah',
        ])->assertUnprocessable();
    }

    public function test_products_require_auth(): void
    {
        $this->getJson('/api/v1/products')->assertUnauthorized();
    }

    public function test_products_scoped_to_cashier_branch(): void
    {
        Product::create([
            'branch_id' => $this->otherBranch->id,
            'sku' => 'BRG-001',
            'name' => 'Barang Cabang Lain',
            'selling_price' => 99999,
            'stock' => 5,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/products', [
            'Authorization' => 'Bearer '.$this->token(),
        ]);

        $response->assertOk();
        $skus = collect($response->json('data'))->pluck('sku');
        $this->assertContains('BRG-001', $skus);
        $this->assertNotContains('99999', collect($response->json('data'))->pluck('selling_price')->all());
    }

    public function test_kasir_can_create_sale(): void
    {
        $response = $this->postJson('/api/v1/sales', [
            'payment_method' => 'CASH',
            'paid_amount' => 30000,
            'items' => [
                ['product_id' => $this->product->id, 'qty' => 2, 'price' => 15000],
            ],
        ], [
            'Authorization' => 'Bearer '.$this->token(),
        ]);

        $response->assertCreated()
            ->assertJsonPath('total', '30000.00')
            ->assertJsonPath('change_amount', '0.00');

        $item = $response->json('items.0');
        $this->assertEquals('10000.00', $item['cost']);
        $this->assertEquals('10000.00', $item['profit']);
        $this->assertStringStartsWith('PJ-TST-01-', $response->json('invoice_no'));

        $this->assertEquals(18, (float) $this->product->fresh()->stock);
    }

    public function test_sale_rejects_foreign_branch_product(): void
    {
        $foreign = Product::create([
            'branch_id' => $this->otherBranch->id,
            'sku' => 'ASING-1',
            'name' => 'Barang Asing',
            'selling_price' => 5000,
            'stock' => 10,
            'is_active' => true,
        ]);

        $this->postJson('/api/v1/sales', [
            'payment_method' => 'CASH',
            'paid_amount' => 5000,
            'items' => [
                ['product_id' => $foreign->id, 'qty' => 1, 'price' => 5000],
            ],
        ], [
            'Authorization' => 'Bearer '.$this->token(),
        ])->assertUnprocessable();
    }

    public function test_logout_revokes_token(): void
    {
        $token = $this->token();

        $this->postJson('/api/v1/logout', [], [
            'Authorization' => 'Bearer '.$token,
        ])->assertOk();

        // Lupakan guard yang ter-cache agar request berikut memvalidasi ulang token
        // ke DB (di produksi tiap request HTTP sudah proses PHP tersendiri).
        Auth::forgetGuards();

        $this->getJson('/api/v1/me', [
            'Authorization' => 'Bearer '.$token,
        ])->assertUnauthorized();
    }
}
