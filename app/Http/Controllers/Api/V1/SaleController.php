<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Concerns\ResolvesBranch;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ApiStoreSaleRequest;
use App\Models\Branch;
use App\Models\Product;
use App\Models\Sale;
use App\Services\SaleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class SaleController extends Controller
{
    use ResolvesBranch;

    public function index(Request $request): JsonResponse
    {
        $branch = $this->resolveBranch($request);
        $perPage = min((int) $request->query('per_page', 20), 100);
        $dateFrom = $request->query('date_from');
        $dateTo = $request->query('date_to');

        $query = Sale::forBranch($branch->id)->withCount('items');

        if (is_string($dateFrom) && $dateFrom !== '') {
            $query->whereDate('sale_date', '>=', $dateFrom);
        }

        if (is_string($dateTo) && $dateTo !== '') {
            $query->whereDate('sale_date', '<=', $dateTo);
        }

        return response()->json($query->latest()->paginate($perPage)->withQueryString());
    }

    public function show(Request $request, Sale $sale): JsonResponse
    {
        $this->authorizeBranch($sale->branch_id);

        return response()->json($sale->load('items.product', 'branch'));
    }

    public function store(ApiStoreSaleRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        $requestedId = $data['branch_id'] ?? null;
        $branch = $user->isOwner() && is_numeric($requestedId)
            ? Branch::findOrFail((int) $requestedId)
            : $this->resolveBranch($request);

        $this->authorizeBranch($branch->id);

        $items = $data['items'];
        if (! is_array($items)) {
            throw ValidationException::withMessages([
                'items' => ['Format items tidak valid.'],
            ]);
        }

        $ids = [];
        foreach ($items as $item) {
            if (is_array($item) && isset($item['product_id']) && is_numeric($item['product_id'])) {
                $ids[] = (int) $item['product_id'];
            }
        }

        $foreign = Product::where('branch_id', '!=', $branch->id)
            ->whereIn('id', $ids)
            ->exists();

        if ($foreign) {
            throw ValidationException::withMessages([
                'items' => ['Ada barang yang bukan milik cabang ini.'],
            ]);
        }

        $sale = SaleService::create(
            $branch,
            $user->id,
            $data['sale_date'] ?? now()->toDateTimeString(),
            $data['payment_method'],
            (float) $data['paid_amount'],
            $data['items']
        );

        return response()->json($sale->load('items.product', 'branch'), 201);
    }

    private function authorizeBranch(int $branchId): void
    {
        $user = request()->user();
        if (! $user->isOwner() && $user->branch_id !== $branchId) {
            abort(403, 'Akses cabang ditolak.');
        }
    }
}
